import bot from "./bot.svg";
import user from "./user.svg";

const form = document.querySelector("form");
const chatContainer = document.querySelector("#chat_container");
const chatlog = [];

if(localStorage.getItem('chatlog'))
{
  let log = JSON.parse(localStorage.getItem('chatlog'))
  chatlog.push(log)
}

chatContainer.innerHTML = chatlog

let loadInterval;

function loader(element) {
  element.textContent = "";

  loadInterval = setInterval(() => {
    // Update the text content of the loading indicator
    element.textContent += ".";

    // If the loading indicator has reached three dots, reset it
    if (element.textContent === "....") {
      element.textContent = "";
    }
  }, 300);
}

function typeText(element, text) {
  let index = 0;

  let interval = setInterval(() => {
    if (index < text.length) {
      element.innerHTML += text.charAt(index);
      index++;
    } else {
      clearInterval(interval);
    }
  }, 20);
}

// generate unique ID for each message div of bot
// necessary for typing text effect for that specific reply
// without unique ID, typing text will work on every element
function generateUniqueId() {
  const timestamp = Date.now();
  const randomNumber = Math.random();
  const hexadecimalString = randomNumber.toString(16);

  return `id-${timestamp}-${hexadecimalString}`;
}

function chatStripe(isAi, value, uniqueId) {
  return `
  <div class=${isAi ? "chatwrapperai" : "chatwrapper"}>
        <div class="wrapper ${isAi && "ai"}">
            <div class="chat">
                ${
                  isAi
                    ? `<div class="message" id=${uniqueId}>${value}</div>
                <div class="profile">
                    <img
                      src=${isAi ? bot : user}
                      alt="${isAi ? "bot" : "user"}"
                    />
                </div>`
                    : ` <div class="profile">
                    <img
                      src=${isAi ? bot : user}
                      alt="${isAi ? "bot" : "user"}"
                    />
                </div>
                <div class="message" id=${uniqueId}>${value}</div>

               `
                }
                
            </div>
        </div>
        </div>
    `;
}

function savelog(content) {
  if(localStorage.getItem('chatlog') == null) {
    const tmp = []
    tmp.push(content)
    localStorage.setItem('chatlog', JSON.stringify(tmp))
  }
  else {
    const tmp = JSON.parse(localStorage.getItem('chatlog'))
    const tmp1 = [...tmp, content]
    localStorage.setItem('chatlog', JSON.stringify(tmp1))
  }
}

const handleSubmit = async (e) => {
  e.preventDefault();

  const data = new FormData(form);
  // user's chatstripe
  chatlog.push(chatStripe(false, data.get("prompt")))
  savelog(chatStripe(false, data.get("prompt")))
  chatContainer.innerHTML += chatlog[chatlog.length-1];
  // to clear the textarea input
  form.reset();
  // bot's chatstripe
  const uniqueId = generateUniqueId();
  chatlog.push(chatStripe(true, " ", uniqueId))
  // console.log(chatStripe(true, " ", uniqueId), "contenet2----------")
  // savelog(chatStripe(true, " ", uniqueId))
  chatContainer.innerHTML += chatlog[chatlog.length-1];
  // to focus scroll to the bottom
  chatContainer.scrollTop = chatContainer.scrollHeight;

  // specific message div
  const messageDiv = document.getElementById(uniqueId);

  // messageDiv.innerHTML = "..."
  loader(messageDiv);
  const response = await fetch("http://10.10.13.131:8000/get_prompt", {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: data.get("prompt"),
    }),
  });

  clearInterval(loadInterval);
  messageDiv.innerHTML = " ";
  // chatlog.push(messageDiv)

  if (response.ok) {
    const data = await response.json();
    const parsedData = data.result.trim(); // trims any trailing spaces/'\n'
    chatlog.pop()
    chatlog.push(chatStripe(true, parsedData, uniqueId))
    savelog(chatStripe(true, parsedData, uniqueId))
    typeText(messageDiv, parsedData);
  } else {
    const err = await response.text();
    messageDiv.innerHTML = "Something went wrong";
  }
};

form.addEventListener("submit", handleSubmit);
form.addEventListener("keyup", (e) => {
  if (e.keyCode === 13) {
    handleSubmit(e);
  }
});
