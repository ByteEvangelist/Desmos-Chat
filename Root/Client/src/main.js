//used to manipulate the calculator
import { startDesmos, Desmos } from './Scripts/desmos.js';
//used to connect to the chat server
import { io } from 'socket.io-client';

import { JSEncrypt } from 'jsencrypt';

//import pages and styles
import mainPage from './Pages/main.html';
import './Styles/main.css';

//called once page loads
export function Start() {
  function encrypt(data, publicKey) {
    var encrypt = new JSEncrypt();
    encrypt.setPublicKey(publicKey);
    var encrypted = encrypt.encrypt(data);

    return encrypted;
  }

  //change from loading page to mainpage
  document.body.innerHTML = mainPage;

  //load desmos so Desmos can be used
  startDesmos();
  //set Desmos to the calculator element
  var calculatorElement = document.getElementById('calculator');
  var calculator = Desmos.GraphingCalculator(calculatorElement, {});

  //connect to the chat server, using polling to avoid cors issues
  var socket = io(process.env.API_URL, {
    transports: process.env.TRANSPORTS,
  });

  let inputValue = '';
  let input;

  let currentPage = 'enterRoomName';
  let previousPage = 'enterRoomName';

  let messages = [];
  let oldMessages = [];

  let username;

  let isChatSelected = true;
  let savedState;

  function setCurrentPage(page) {
    previousPage = currentPage;
    currentPage = page;
    renderPage();
  }

  function focusLastExpression() {
    if (input != undefined) {
      input.removeEventListener('keydown', (e) => {
        keyPressed(e);
      });
      input.removeEventListener('input', () => {
        updateSelectionRange();
        setInputValue();
      });
      input.removeEventListener('select', updateSelectionRange);
      input.removeEventListener('keyup', updateSelectionRange);
      input.removeEventListener('mouseup', updateSelectionRange);
      input.removeEventListener('touchend', updateSelectionRange);
    }

    input = document.querySelector(
      `.dcg-template-expressioneach .dcg-smart-textarea[aria-label="Note ${
        messages.length + 1
      }"]`
    );
    if (input != undefined) {
      input.setSelectionRange(selectionStart, selectionEnd);
      input.addEventListener('input', () => {
        updateSelectionRange();
        setInputValue();
      });
      input.addEventListener('keydown', (e) => {
        keyPressed(e);
      });
      input.addEventListener('select', updateSelectionRange);
      input.addEventListener('keyup', updateSelectionRange);
      input.addEventListener('mouseup', updateSelectionRange);
      input.addEventListener('touchend', updateSelectionRange);
      if (isChatSelected) {
        input.focus();
        calculator.pleaseFocusLastExpression();
      }
      return;
    } else {
      // calculator.pleaseFocusLastExpression();
      if (currentPage != 'waitingRoom') {
        setTimeout(() => {
          focusLastExpression();
        }, 1);
      }
    }
    function setInputValue() {
      inputValue = input.value;
    }
  }
  renderPage();
  focusLastExpression();
  let selectionStart = 0;
  let selectionEnd = 0;
  function updateSelectionRange() {
    selectionStart = input.selectionStart;
    selectionEnd = input.selectionEnd;
  }
  let roomName;
  function keyPressed(e) {
    if (isChatSelected) {
      if (e.key == 'Enter') {
        renderPage();
        focusLastExpression();
        if (inputValue !== '') {
          switch (currentPage) {
            case 'enterRoomName':
              socket.emit('roomName', inputValue);
              roomName = inputValue;
              inputValue = '';
              setCurrentPage('waitingRoom');
              messages = [];
              if (savedState) {
                calculator.setState(savedState);
              } else {
                calculator.setState({
                  version: 10,
                  expressions: {
                    list: [
                      {
                        type: 'expression',
                        id: 1,
                        latex: '',
                      },
                      {
                        type: 'expression',
                        id: 2,
                        latex: '',
                      },
                    ],
                  },
                });
              }
              calculator.pleaseFocusLastExpression();
              break;
            case 'enterPassword':
              let encryptedPassword = encrypt(inputValue, publicKey);
              socket.emit('password', roomName, encryptedPassword);
              inputValue = '';
              setCurrentPage('waitingRoom');
              messages = [];
              if (savedState) {
                calculator.setState(savedState);
              } else {
                calculator.setState({
                  version: 10,
                  expressions: {
                    list: [
                      {
                        type: 'expression',
                        id: 1,
                        latex: '',
                      },
                    ],
                  },
                });
              }
              calculator.pleaseFocusLastExpression();
              break;
            case 'chooseUsername':
              username = inputValue;
              inputValue = '';
              messages = [...oldMessages];
              socket.emit('username', username);
              setCurrentPage('chatRoom');
              renderPage();
              focusLastExpression();
              calculator.pleaseFocusLastExpression();
              break;
            case 'chatRoom':
              socket.emit('message', roomName, username, inputValue);
              inputValue = '';
              focusLastExpression();
            default:
              focusLastExpression();
              break;
          }
        } else {
          if (
            currentPage == 'enterPassword' ||
            currentPage == 'enterRoomName'
          ) {
            setCurrentPage('waitingRoom');
            messages = [];
            if (savedState) {
              calculator.setState(savedState);
            } else {
              calculator.setState({
                version: 10,
                expressions: {
                  list: [
                    {
                      type: 'expression',
                      id: 1,
                      latex: '',
                    },
                    {
                      type: 'expression',
                      id: 2,
                      latex: '',
                    },
                  ],
                },
              });
            }
            calculator.pleaseFocusLastExpression();
          }
        }
      }
    }
  }

  document.addEventListener('keydown', (e) => {
    switch (e.key) {
      case 'Escape':
        switch (currentPage) {
          case 'waitingRoom':
            setCurrentPage(previousPage);
            focusLastExpression();
            break;
          default:
            setCurrentPage('waitingRoom');
            if (savedState) {
              calculator.setState(savedState);
            } else {
              calculator.setState({
                version: 10,
                expressions: {
                  list: [
                    {
                      type: 'expression',
                      id: 1,
                      latex: '',
                    },
                  ],
                },
              });
            }
            break;
        }
      // default:
      //   switch (currentPage) {
      //     case 'waitingRoom':
      //       savedState = calculator.getState();
      //       break;
      //   }
    }
  });

  calculator.observeEvent('change', () => {
    if (currentPage == 'waitingRoom') {
      savedState = calculator.getState();
    }
  });

  function renderPage() {
    if (currentPage == 'chatRoom') {
      renderChatRoom();
    }
    if (currentPage == 'enterRoomName') {
      calculator.setState({
        version: 10,
        expressions: {
          list: [
            {
              type: 'text',
              id: (messages.length + 1).toString(),
              text: inputValue,
            },
          ],
        },
      });
    }
    if (currentPage == 'enterPassword') {
      calculator.setState({
        version: 10,
        expressions: {
          list: [
            {
              type: 'text',
              id: (messages.length + 1).toString(),
              text: inputValue,
            },
          ],
        },
      });
    }
    if (currentPage == 'chooseUsername') {
      messages = [{ message: 'Choose Username', readonly: true }];
      calculator.setState({
        version: 10,
        expressions: {
          list: [
            ...messages.map((msg, index) => {
              return {
                type: 'text',
                id: index,
                text: msg.message,
                readonly: true,
              };
            }),
            {
              type: 'text',
              id: (messages.length + 1).toString(),
              text: inputValue,
            },
          ],
        },
      });
      focusLastExpression();
    }
  }

  function renderChatRoom() {
    calculator.setState({
      version: 10,
      expressions: {
        list: [
          ...messages.map((msg, index) => {
            return {
              type: 'text',
              id: index,
              text: msg.username + ': ' + msg.message,
              readonly: true,
            };
          }),
          {
            type: 'text',
            id: (messages.length + 1).toString(),
            text: inputValue,
          },
        ],
      },
    });

    focusLastExpression();
  }

  socket.on('message', (username, text) => {
    messages.push({ username: username, message: text });
    if (currentPage == 'chatRoom') {
      renderPage();
    }
  });
  let publicKey;
  socket.on('event', (event) => {
    switch (event) {
      case 'joined room':
        inputValue = '';
        setCurrentPage('chooseUsername');
        messages = [{ message: 'Choose Username', readonly: true }];
        calculator.setState({
          version: 10,
          expressions: {
            list: [
              ...messages.map((msg, index) => {
                return {
                  type: 'text',
                  id: index,
                  text: msg.message,
                  readonly: true,
                };
              }),
              {
                type: 'text',
                id: (messages.length + 1).toString(),
                text: inputValue,
              },
            ],
          },
        });
        focusLastExpression();
        break;
      case 'password required':
        break;
    }
  });
  socket.on('public key', (key) => {
    publicKey = key;
    setCurrentPage('enterPassword');
    renderPage();
    focusLastExpression();
  });
  socket.on('message history', (msgs) => {
    oldMessages = [...msgs].map((msg) => {
      return { username: msg.username, message: msg.text };
    });
  });

  document.addEventListener('click', (e) => {
    updateIsChatSelected(e);
    updateSelectionRange();
  });

  function updateIsChatSelected() {
    isChatSelected = calculator.isAnyExpressionSelected;
  }
}
