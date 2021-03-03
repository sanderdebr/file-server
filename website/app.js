const $form = document.createElement("form");
const $textarea = document.createElement("textarea");
$textarea.rows = "30";
$textarea.cols = "100";
const $button = document.createElement("button");
$button.type = "submit";
$button.textContent = "Save file";
$button.onclick = (e) => savePage(e);
const $divider = document.createElement("hr");

function setupDOM() {
  $form.appendChild($textarea);
  $form.appendChild($divider);
  $form.appendChild($button);
  document.body.appendChild($form);
}

async function loadPage() {
  try {
    const response = await fetch("/website/index.html");
    const text = await response.text();

    $textarea.value = text;
  } catch (err) {
    console.log(err);
  }
}

async function savePage(e) {
  e.preventDefault();
  try {
    const response = await fetch("/website/index.html", {
      method: "PUT",
      body: $textarea.value,
    });
    const result = await response;
    if (!result.ok) throw "Not ok..";
    location.reload();
  } catch (err) {
    console.log(err);
  }
}

setupDOM();
loadPage();
