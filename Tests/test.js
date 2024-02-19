//used to manipulate the calculator
import { startDesmos, Desmos } from '../Root/Client/src/Scripts/desmos.js';
//used to connect to the chat server
import { io } from 'socket.io-client';

//import pages and styles
import mainPage from './Pages/main.html';
import './Styles/main.css';

//called once page loads
export function Start() {
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

  let currentPage = 'enterPassword';
  let previousPage = 'enterPassword';

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
      input.removeEventListener('input', setInputValue);
      input.removeEventListener('keydown', keyPressed);
      // input.removeEventListener('select', updateSelectionRange);
      // input.removeEventListener('keyup', updateSelectionRange);
      // input.removeEventListener('mouseup', updateSelectionRange);
      // input.removeEventListener('touchend', updateSelectionRange);
    }

    input = document.querySelector(
      `.dcg-template-expressioneach .dcg-smart-textarea[aria-label="Note ${
        messages.length + 1
      }"]`
    );

    if (input != undefined) {
      input.addEventListener('input', setInputValue);
      input.addEventListener('keydown', keyPressed);
      // input.addEventListener('select', updateSelectionRange);
      // input.addEventListener('keyup', updateSelectionRange);
      // input.addEventListener('mouseup', updateSelectionRange);
      // input.addEventListener('touchend', updateSelectionRange);

      if (isChatSelected) {
        input.focus();
        calculator.pleaseFocusLastExpression();
      }
      return;
    } else {
      calculator.pleaseFocusLastExpression();
      if (currentPage != 'waitingRoom') {
        setTimeout(() => {
          focusLastExpression();
        }, 1);
      }
    }
    function setInputValue() {
      inputValue = input.value;
      input.setSelectionRange(selectionStart, selectionStart);
    }
  }
  renderPage();
  focusLastExpression();
  let selectionStart = 0;
  let selectionEnd = 0;
  function updateSelectionRange() {
    console.log(input.selectionStart, input.selectionEnd);
    selectionStart = input.selectionStart;
    selectionEnd = input.selectionEnd;
  }

  function keyPressed(e) {
    if (!isChatSelected) {
      if (currentPage == 'chatRoom') {
      }
    } else {
      if (currentPage != 'waitingRoom') {
        // renderPage();
        // focusLastExpression();
      }
      if (e.key == 'Enter') {
        focusLastExpression();
        if (inputValue !== '') {
          if (currentPage == 'enterPassword') {
            socket.emit('password', inputValue);
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
            focusLastExpression();
          } else {
            if (currentPage == 'chooseUsername' && inputValue !== '') {
              username = inputValue;
              inputValue = '';
              messages = [...oldMessages];
              socket.emit('username', username);
              setCurrentPage('chatRoom');
              renderPage();
              focusLastExpression();
            } else {
              if (currentPage == 'chatRoom') {
                socket.emit('chat message', inputValue);
                inputValue = '';
              }
              focusLastExpression();
            }
          }
        } else {
          if (currentPage == 'enterPassword') {
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
            focusLastExpression();
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
    console.log('rendering page');
    if (currentPage == 'chatRoom') {
      renderChatRoom();
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

    if (isChatSelected) {
      focusLastExpression();
    }
  }

  socket.on('chat message', function (msg) {
    messages.push(msg);
    if (currentPage == 'chatRoom') {
      renderPage();
    }
  });

  socket.on('system message', (message) => {
    if (currentPage == 'waitingRoom') {
      if (message == 'access granted') {
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
      }
    }
  });

  socket.on('messages', (msgs) => {
    oldMessages = [...msgs];
  });

  document.addEventListener('click', (e) => {
    updateIsChatSelected(e);
    updateSelectionRange();
  });

  function updateIsChatSelected() {
    isChatSelected = calculator.isAnyExpressionSelected;
  }
}
