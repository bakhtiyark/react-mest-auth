//React компоненты
import {useEffect, useState} from 'react';
import { Switch, Route, Redirect, useHistory } from 'react-router-dom'

//Родные компоненты
import Header from "./Header.js"
import Main from "./Main.js"
import Footer from "./Footer.js"
import ImagePopup from "./ImagePopup.js";
import EditProfilePopup from "./EditProfilePopup.js";
import EditAvatarPopup from "./EditAvatarPopup.js";
import AddPlacePopup from "./AddPlacePopup.js";

import ProtectedRoute from './ProtectedRoute.js';
import Register from './Register.js';
import Login from './Login.js';
import InfoTooltip from './InfoTooltip.js';

//Контексты
import { CurrentUserContext } from "../contexts/CurrentUserContext.js";

//Api
import { api } from "../utils/Api.js";
import auth from "../utils/Auth.js"

// Иконки статуса
import successIcon from "../images/success-icon.svg"
import failureIcon from "../images/failure-icon.svg"

function App() {

  const history = useHistory()

  //Данные о пользователе
  const [currentUser, setCurrentUser] = useState({});
  const [loggedIn, setLoggedIn] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  
  //Карты
  const [cards, setCards] = useState([]);
  
  //Раскрытая карта
  const [selectedCard, setSelectedCard] = useState({})

  //Стейты попапов
  const [isAvatarPopupOpen, setAvatarPopupOpen] = useState(false)
  const [isAddPlacePopupOpen, setAddPlacePopupOpen] = useState(false)
  const [isProfilePopupOpen, setProfilePopupOpen] = useState(false)
  const [isInfoTooltipPopupOpen, setIsInfoTooltipPopupOpen] = useState(false)

  // Сообщение статуса 
  const [message, setMessage] = useState({});

  useEffect(() => {
    api.getUserInfo().then((data) => {
      setCurrentUser(data);
    }).catch((err) => {
      console.log(err);
    });
  }, []);


  useEffect(() => {
    api.getInitialCards().then((res) => {
      //console.dir(res)
      setCards(res)
    }).catch((err) => {
      console.log(err);
    })
  }, [])


  // Открытие соответствующих попапов
  function replaceAvatar() {
    setAvatarPopupOpen(true)
  }

  function addPlace() {
    setAddPlacePopupOpen(true)
  }

  function openProfilePopup() {
    setProfilePopupOpen(true)
  }

  //Закрытие Попапов

  function closePopups() {
    setAvatarPopupOpen(false)
    setAddPlacePopupOpen(false)
    setProfilePopupOpen(false)
    setSelectedCard({})
    //console.log("lala")
  }
  function openCardPopup(card) {
    setSelectedCard({ src: card.link, alt: card.name, opened: true });
  }

  //Установка данных пользователей
  function handleUpdateUser(data) {
    api.setUserInfo(data).then((data) => {
      setCurrentUser(data)
    }).catch((err) => {
      console.log(err);
    });
    closePopups();
  }

  //Аптейт аватара
  function handleAvatarUpdate(data) {
    api.setUserAvatar(data).then((link) => {
      setCurrentUser(link)
    }).catch((err) => {
      console.log(err);
    });
    closePopups();
  }

  // Лайканье

  function handleCardLike(card) {
    // Снова проверяем, есть ли уже лайк на этой карточке
    const isLiked = card.likes.some(i => i._id === currentUser._id);

    // Отправляем запрос в API и получаем обновлённые данные карточки
    api.changeLikeCardStatus(card._id, !isLiked).then((newCard) => {
      setCards((state) => state.map((c) => c._id === card._id ? newCard : c));
    }).catch((err) => {
      console.log(err);
    });
  }
  // Удаление карты
  function handleCardDelete(card) {
    api
      .deleteCard(card._id)
      .then(() => {
        setCards((state) => state.filter((c) => c._id !== card._id));
      })
      .catch((err) => {
        console.log(err);
      });
  }

  // Добавление места
  function handleAddPlaceSubmit(data) {
    api.createCard(data).then((newCard) => {
      setCards([newCard, ...cards]);
      closePopups();
    }).catch((err) => {
      console.log(err);
    })
  }

  // Регистрация 
  function handleRegistration(password, email) {
    auth
      .register(password, email)
      .then(res => {
        if (res) {
          setMessage({
            imgInfo: successIcon,
            text: 'Вы успешно зарегистрировались!' 
          })
          history.push('/sign-in')
        }
      })
      .catch(setMessage({
        imgInfo: failureIcon,
        text: 'Что-то пошло не так! Попробуйте ещё раз.' 
      }))
      .finally(() => setIsInfoTooltipPopupOpen(true))
  }

  //Вход по логину
  function handleLogin(password, email) {
    auth
      .login(password, email)
      .then(res => {
        if(res.token) {
          localStorage.setItem('token', res.token)
          setUserEmail(email)
          setLoggedIn(true)
        } else {
          setMessage({
            imgInfo: failureIcon, 
            text: 'Что-то пошло не так! Попробуйте ещё раз.' 
          })
          setIsInfoTooltipPopupOpen(true)
        }
      })
      .catch((err) => console.log(err))
  }

  //Выход из аккаунта

  function handleSignOut() {
    setLoggedIn(false)
    localStorage.removeItem('token')
    history.push('/sign-in')
  }


  return (
    <CurrentUserContext.Provider value={currentUser}>
      <div className="page">
        <Header onSignOut={handleSignOut} userEmail={userEmail} />
        <Switch>
          <Route path="/sign-up">
            <Register onRegistration={handleRegistration} />
          </Route>
          <Route path="/sign-in">
            <Login onLogin={handleLogin} />
          </Route>
          <Route>{loggedIn ? <Redirect to="/" />: <Redirect to="/sign-in" />}</Route>
        </Switch>


        <EditProfilePopup isOpen={isProfilePopupOpen} onClose={closePopups} onUpdateUser={handleUpdateUser} />
        <EditAvatarPopup isOpen={isAvatarPopupOpen} onClose={closePopups} onUpdateAvatar={handleAvatarUpdate} />
        <AddPlacePopup isOpen={isAddPlacePopupOpen} onClose={closePopups} onSubmitPlace={handleAddPlaceSubmit} />

        <Main
          replaceAvatar={replaceAvatar}
          addPlace={addPlace}
          openProfilePopup={openProfilePopup}
          closePopups={closePopups}
          onCardClick={openCardPopup}
          cards={cards}
          onCardLike={handleCardLike}
          onCardDelete={handleCardDelete}
        />

        <ImagePopup card={selectedCard} onClose={closePopups}></ImagePopup>

        <Footer />

        <script type="module" src="./pages/index.js"></script>
      </div>
    </CurrentUserContext.Provider>);
}

export default App;
