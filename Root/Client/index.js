import { io } from 'https://cdn.socket.io/4.4.1/socket.io.esm.min.js';
var socket = io('ws://localhost:3000', {
  transports: ['websocket'],
});

var calculatorElement = document.getElementById('calculator');
var calculator = Desmos.GraphingCalculator(calculatorElement, {});

let textValue = '';
let input;

let currentPage = 'enterPassword';

let messages = [];
let oldMessages = [];
let username;

let isChatSelected = true;

function setCurrentPage(page) {
  currentPage = page;
}

function focusLastExpression() {
  if (input != undefined) {
    input.removeEventListener('input', (e) => {
      keyPressed(e);
    });
    input.removeEventListener('input', () => {
      setTextValue();
    });
  }

  // input = document.getElementsByClassName('dcg-main')[messages.length];
  input = document.querySelector(
    `.dcg-template-expressioneach .dcg-smart-textarea[aria-label="Note ${
      messages.length + 1
    }"]`
  );

  console.log(input);
  if (input != undefined) {
    input.addEventListener('input', () => {
      setTextValue();
    });
    input.addEventListener('keydown', (e) => {
      keyPressed(e);
    });
    if (isChatSelected) {
      calculator.pleaseFocusLastExpression();
    }
    return;
  } else {
    calculator.pleaseFocusLastExpression();
    setTimeout(() => {
      focusLastExpression();
    }, 1);
  }
  function setTextValue() {
    // textValue = input.firstChild.children[1].value;
    textValue = input.value;
  }
}
renderPage();
focusLastExpression();

function keyPressed(e) {
  if (!isChatSelected) {
    if (currentPage == 'chatRoom') {
    }
  } else {
    if (currentPage != 'waitingRoom') {
      renderPage();
      focusLastExpression();
    }
    if (e.key == 'Enter') {
      focusLastExpression();
      if (textValue !== '') {
        if (currentPage == 'enterPassword') {
          socket.emit('password', textValue);
          textValue = '';
          setCurrentPage('waitingRoom');
          messages = [];
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
        } else {
          if (currentPage == 'chooseUsername') {
            username = textValue;
            textValue = '';
            messages = [...oldMessages];
            socket.emit('username', username);
            setCurrentPage('chatRoom');
            renderPage();
            focusLastExpression();
          } else {
            if (currentPage == 'chatRoom') {
              socket.emit('chat message', textValue);
              textValue = '';
            }
            focusLastExpression();
          }
        }
      }
    }
  }
}

function renderPage() {
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
            text: textValue,
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
            text: textValue,
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
          text: textValue,
        },
      ],
    },
  });

  if (isChatSelected) {
    focusLastExpression();
  }
}

socket.on('chat message', function (msg) {
  if (currentPage == 'chatRoom') {
    messages.push(msg);
    renderPage();
  }
});

socket.on('system message', (message) => {
  if (currentPage == 'waitingRoom') {
    if (message == 'access granted') {
      textValue = '';
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
              text: textValue,
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

document.addEventListener('click', (e) => updateIsChatSelected(e));

function updateIsChatSelected() {
  isChatSelected = calculator.isAnyExpressionSelected;
}
