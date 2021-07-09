chrome.runtime.onMessage.addListener(receive);
const HTML_NO_RESULT = `
<p class="text-gray-700 text-center" style="font-size: 16px; line-height: 1.4;">
  Cliquez sur les chiffres que <br /> vous souhaitez additionner
</p>`;

let showPopup = false;
let clipboard = {};
let numbers = [];
let deleteNumberIds = [];
let objectNumbers = [];

// Remove <a /> elements
const changeDomAElements = () => {
  const domAElements = document.getElementsByTagName("a");

  Array.from(domAElements).forEach((elm) => {
    elm.href = "";
    elm.classList.add("no-after", "no-before");
  });
};

// Find correct Number
const findNumber = (string) => {
  let str = string;

  if (string) {
    if (str.includes("€")) {
      str = str.replace("€", ",");
    }

    var matches = str.replace(",", ".").replace(/[^0-9&.]/g, "");

    if (matches && matches.length > 0) {
      if (Number(matches)) return matches;
    } else {
      return null;
    }
  }

  return null;
};

const handler = (e) => {
  e.preventDefault();

  const ignoredElement = document.getElementById("sumBox");

  if (ignoredElement) {
    const isIgnoredElementClicked = ignoredElement.contains(e.target);

    if (!isIgnoredElementClicked) {
      const NUMBER = Number(findNumber(e.target.innerText));

      if (NUMBER) {
        calculate(e, NUMBER);
      }
    } else if (
      e?.target?.parentElement?.id === "numbers" &&
      e?.target?.dataset?.matchId
    ) {
      // Scroll to correct number
      const elm = document.querySelector(
        `[data-id="${e.target.dataset.matchId}"]`
      );

      if (elm) {
        window.scrollTo({
          top:
            elm.getBoundingClientRect().top -
            elm.getBoundingClientRect().height,
          left: 0,
          behavior: "smooth",
        });
      }
    }
  }
};

const calculate = (e, NUMBER) => {
  if (NUMBER) {
    if (numbers.length === 0) {
      document
        .getElementById("calculate_clear_all")
        .classList.remove("opacity-0");
      document
        .getElementById("calculate_clear_all")
        .classList.add("opacity-100");
    }

    if (e?.target?.dataset?.id && e?.target?.dataset?.id !== "null") {
      // already exist
      const id =
        Number(e?.target?.dataset?.id) > 0 ? Number(e?.target?.dataset?.id) : 0;

      deleteNumberIds.push(id);
      deleteNumberIds.forEach((deleteId) => {
        const elm = document.querySelector(`[data-id="${deleteId}"]`);
        if (elm) {
          e.target.style.backgroundColor = "";
          e.target.style.color = "";
          e.target.style.padding = "";
          e.target.style.borderRadius = "";
          e.target.style.fontSize = "";
          e.target.style.width = "";
          e.target.classList.remove("block", "shadow");
          elm.dataset.id = null;
        }
      });
    } else {
      const id = numbers.length;
      if (e) {
        e.target.dataset.id = id;
        e.target.classList.add("block", "shadow");
        e.target.style.backgroundColor = "#111827";
        e.target.style.borderRadius = "35px";
        e.target.style.color = "#ffffff";
        e.target.style.fontSize = "16px";
        e.target.style.padding = "8px 12px";
        e.target.style.width = "min-content";
      }

      numbers.push(NUMBER);
      objectNumbers.push({
        id,
        value: NUMBER,
      });
    }

    // Enrase html
    document.getElementById("numbers").innerHTML = "";

    // Add all numbers
    const selectedNumbers = objectNumbers.filter(
      (number) => !deleteNumberIds.includes(number.id)
    );
    selectedNumbers.forEach((number) => {
      document.getElementById(
        "numbers"
      ).innerHTML += `<span data-match-id="${number.id}" class="sum cursor-pointer block text-gray-600">${number.value}€ +</span>`;
    });

    document.getElementById("calculate_container_price").scrollTo({
      top: document.getElementById("calculate_container_price").clientHeight,
      left: 0,
      behavior: "smooth",
    });

    const subTotal = selectedNumbers
      .map((x) => x.value)
      .reduce((a, b) => a + b, 0);
    const total = Math.round(subTotal * 100) / 100;

    document.getElementById("total").innerHTML = `Total : ${total}€`;
  }
};

// Create popup and add on the DOM
const addPopup = async () => {
  // sumBox
  content = HTML_NO_RESULT;
  let older = "";
  if (clipboard.website && clipboard.sum) {
    older = `
      <div class="flex flex-col justify-between items-center">
        <h2 style="line-height: 1.4;">Montant déjà additioné</h2>
        <div class="w-full flex justify-between items-center" style="margin-bottom: 10px;">
          <p class="text-center w-1/2" style="line-height: 1.4;">
            Site :<br/> <strong>${clipboard.website}</strong>
          </p>
          <p class="text-center w-1/2" style="line-height: 1.4;">
            Montant :<br/> <strong>${clipboard.sum} €</strong>
          </p>
        </div>

        <div class="w-full flex flex-col justify-between items-center text-sm mt-6" style="margin-top: 24px; font-size: 14px;">
          <button type="button" id="add_sum" style="padding: 8px 12px; line-height: 1.4; margin-bottom: 8px;" class="px-3 py-2 bg-gray-700 hover:bg-opacity-70 transition-colors text-white mb-2 rounded-full">
            Ajouter ce montant
          </button>
          <button type="button" id="delete_sum" style="padding: 8px 12px; line-height: 1.4;" class="px-3 py-2 bg-red-500 hover:bg-opacity-70 transition-colors text-white rounded-full">
            Supprimer ce montant
          </button>
        </div>
      </div>
    `;

    content = older;
  }

  const HTML = `
      <style>
      .no-after:after {
        content: none;
      }
      .no-before:before {
        content:none;
      }
      .grid {
        display: flex!important;
      }
      </style>
      <link href="https://unpkg.com/tailwindcss@^2/dist/tailwind.min.css" rel="stylesheet">

      <div
        id="sumBox"
        class="sum_box flex flex-col justify-between fixed top-0 right-0 bg-white h-auto"
        style="z-index: 9999; width: 344px; max-height: 430px; top: 12px; padding: 18px; right: 16px; border: 0; border-radius: 20px; box-shadow: rgba(149, 157, 165, 0.2) 0px 8px 24px;"
      >
        <div>
          <div class="flex justify-center items-center">
            <button
              id="calculate_refresh"
              title="Refresh"
              type="button"
              style="position: absolute; top: 20px; left: 20px; font-size: 14px;"
              class="rounded-full p-2 transition-colors hover:bg-gray-200 text-sm text-gray-400"
            >
              <svg xmlns="http://www.w3.org/2000/svg" style="width: 16px; height: 16px;" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <h1 class="mt-6 text-2xl font-bold text-center" style="font-size: 24px; line-height: 1.4;">
              <div
                class="sumBox_grab absolute top-0 left-0 right-0 text-gray-200 flex items-center justify-center"
                style="height: 15px; overflow: hidden; cursor: grab;"
              >
                /////////////
              </div>
              😇 </br>
              Additionnez
            </h1>
            <button
              id="calculate_close"
              title="Fermer"
              type="button"
              style="position: absolute; top: 20px; right: 20px; font-size: 14px;"
              class="rounded-full p-2 transition-colors hover:bg-gray-200 text-sm text-gray-400"
            >
              <svg xmlns="http://www.w3.org/2000/svg" style="width: 16px; height: 16px;" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div id="calculate_container_price" class="my-10 overflow-scroll">
          <div class="text-base	break-all m-0 text-gray-700" id="numbers" style="font-size: 16px; line-height: 1.4;">
            ${content}
          </div>
        </div>

        <div class="flex justify-between items-center">
          <div class="flex flex-col items-center justify-center relative">
            <p class="font-bold text-lg text-gray-700 m-0 cursor-pointer" id="total" title="Copier" style="font-size: 18px;"></p>
            <p id="toast" style="font-size: 14px;" class="opacity-0 invisible text-gray-600 absolute w-full bg-white text-center">Copier !</p>
          </div>
          <button id="calculate_clear_all" class="opacity-0 text-sm text-red-400" style="font-size: 14px;">
            Désélectionner
          </button>
        </div>
      </div>
    `;

  document.getElementsByTagName("body")[0].insertAdjacentHTML("afterend", HTML);
  handleKeyPressed();
};

const handleKeyPressed = () => {
  function filter(e) {
    let target = document.getElementById("sumBox");

    if (!e.target.classList.contains("sumBox_grab")) {
      return;
    }

    target.moving = true;

    e.clientX
      ? ((target.oldX = e.clientX), (target.oldY = e.clientY))
      : ((target.oldX = e.touches[0].clientX),
        (target.oldY = e.touches[0].clientY));

    target.oldLeft =
      window.getComputedStyle(target).getPropertyValue("left").split("px")[0] *
      1;
    target.oldTop =
      window.getComputedStyle(target).getPropertyValue("top").split("px")[0] *
      1;

    document.onmousemove = dr;
    document.ontouchmove = dr;

    function dr(event) {
      event.preventDefault();

      if (!target.moving) {
        return;
      }
      event.clientX
        ? ((target.distX = event.clientX - target.oldX),
          (target.distY = event.clientY - target.oldY))
        : ((target.distX = event.touches[0].clientX - target.oldX),
          (target.distY = event.touches[0].clientY - target.oldY));

      target.style.left = target.oldLeft + target.distX + "px";
      target.style.top = target.oldTop + target.distY + "px";
    }

    function endDrag() {
      target.moving = false;
    }

    target.onmouseup = endDrag;
    target.ontouchend = endDrag;
  }

  document.onmousedown = filter;
  document.ontouchstart = filter;
};

const toPromise = (callback) => {
  const promise = new Promise((resolve, reject) => {
    try {
      callback(resolve, reject);
    } catch (err) {
      reject(err);
    }
  });
  return promise;
};

const saveData = async () => {
  const websiteName = window.location.host;
  const totalSum = document
    .getElementById("total")
    .innerText.replace("Total : ", "")
    .replace("€", "");
  const value = { website: websiteName, sum: Number(totalSum) };
  await toPromise((resolve, reject) => {
    chrome.storage.local.set({ pages: value }, () => {
      if (chrome.runtime.lastError) reject(chrome.runtime.lastError);

      resolve(value);

      // Show toast
      const toast = document.getElementById("toast");
      toast.classList.remove("opacity-0", "invisible");
      toast.classList.add("opacity-100", "visible");

      setTimeout(() => {
        toast.classList.remove("opacity-100", "visible");
        toast.classList.add("opacity-0", "invisible");
      }, 500);
    });
  });
};

const getData = () => {
  return toPromise((resolve, reject) => {
    chrome.storage.local.get("pages", (result) => {
      if (chrome.runtime.lastError) reject(chrome.runtime.lastError);

      const researches = result.pages ?? [];
      resolve(researches);
    });
  });
};

const deleteData = () => {
  return toPromise((resolve, reject) => {
    chrome.storage.local.remove("pages", () => {
      if (chrome.runtime.lastError) reject(chrome.runtime.lastError);

      resolve();
    });
  });
};

const closePopup = () => {
  showPopup = false;
  document.removeEventListener("click", handler);
  document.location.reload();
};

const clearAll = () => {
  objectNumbers.forEach((number) => {
    const elm = document.querySelector(`[data-id="${number.id}"]`);
    if (elm) {
      elm.style.backgroundColor = "";
      elm.style.color = "";
      elm.padding = "";
      elm.borderRadius = "";
      elm.classList.remove(
        "block",
        "text-white",
        "p-2",
        "rounded-full",
        "shadow"
      );
      elm.dataset.id = null;
    }
  });

  document.getElementById("numbers").innerHTML = HTML_NO_RESULT;
  document.getElementById("total").innerHTML = "";

  document
    .getElementById("calculate_clear_all")
    .classList.remove("opacity-100");
  document.getElementById("calculate_clear_all").classList.add("opacity-0");

  numbers = [];
  deleteNumberIds = [];
  objectNumbers = [];
};

async function receive(msg) {
  clipboard = await getData();

  if (msg.txt === "execute") {
    // Show popup
    if (!showPopup) {
      showPopup = true;
      addPopup();
      changeDomAElements();

      document.body.style.cursor = "pointer";
      document.addEventListener("click", handler, true);
      if (document.getElementById("total")) {
        document.getElementById("total").addEventListener("click", () => {
          saveData();
        });
      }

      if (document.getElementById("calculate_clear_all")) {
        document
          .getElementById("calculate_clear_all")
          .addEventListener("click", () => {
            clearAll();
          });
      }
      document
        .getElementById("calculate_refresh")
        .addEventListener("click", () => {
          changeDomAElements();
        });
      document
        .getElementById("calculate_close")
        .addEventListener("click", () => {
          closePopup();
        });

      if (clipboard.website && clipboard.sum) {
        document.getElementById("add_sum").addEventListener("click", () => {
          const NUMBER = Number(clipboard.sum);
          calculate(null, NUMBER);
        });
        document.getElementById("delete_sum").addEventListener("click", () => {
          deleteData();
          document.getElementById("numbers").innerHTML = HTML_NO_RESULT;
        });
      }
    } else {
      // Remove popup
      closePopup();
    }
  }
}
