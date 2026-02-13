// ===== UI FUNCTIONS =====

function updateXsdType(type) {
  if (type == 'xs') {
    xsdType = "xs";
    document.getElementById("custom_xsdType").disabled = true;
    document.getElementById("radio_xs").checked = true;
  } else if (type == 'xsd') {
    xsdType = "xsd";
    document.getElementById("custom_xsdType").disabled = true;
    document.getElementById("radio_xsd").checked = true;
  } else if (type == 'custom') {
    var inputField = document.getElementById("custom_xsdType");
    inputField.disabled = false;
    document.getElementById("radio_custom").checked = true;
    xsdType = inputField.value;
  }
}

function changeMode(mode) {
  if (mode == "text") {
    document.getElementById("option_textarea").removeAttribute("hidden");
    document.getElementById("option_url").setAttribute("hidden", "");
  } else if (mode == "url") {
    document.getElementById("option_url").removeAttribute("hidden");
    document.getElementById("option_textarea").setAttribute("hidden", "");
  }
}

async function fetchURL(url, save) {
  // Auto-add https:// if missing
  if (url && !url.match(/^https?:\/\//i)) {
    url = 'https://' + url;
    document.getElementById('inputURL').value = url;
  }

  var response;
  try {
    response = await fetch(url);
    if (!response.ok) {
      errorToUser('Something went wrong: HTTP ' + response.status);
      return;
    }
  } catch (err) {
    errorToUser("Something went wrong: Can't reach the content. If running locally (file://), try using a local server instead.");
    console.log(err);
    return;
  }

  var data = await response.text();
  var parser = new DOMParser();
  var xmlDoc = parser.parseFromString(data, "text/xml");

  if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
    errorToUser('Something went wrong: This is not an XML file');
    return;
  }

  if (save === true) {
    var URLname = document.getElementById("saveURL_name").value;

    if (URLname.length < 5) {
      errorToUser("Name is too short, please give the URL a longer name. (min 5 characters)");
      return;
    }

    savedURLs = JSON.parse(localStorage.getItem("savedURLs")) || {};

    if (savedURLs[URLname]) {
      errorToUser("Name is already taken. Change name or delete existing url with this name.");
      return;
    }
    for (var key in savedURLs) {
      if (savedURLs[key].url == url) {
        errorToUser("This URL is already saved under name " + key + ".");
        return;
      }
    }

    savedURLs[URLname] = { "url": url, "type": xsdType, "customtype": document.getElementById("custom_xsdType").value };
    localStorage.setItem("savedURLs", JSON.stringify(savedURLs));
    updateDropdown(savedURLs);
    return;
  }

  LoadSchema(data);
}

function updateDropdown(urls) {
  // Render saved URLs as clickable list items
  var container = document.getElementById('savedUrlList');
  if (!container) return;
  container.innerHTML = '';

  var keys = Object.keys(urls);
  if (keys.length < 1) {
    container.innerHTML = '<div class="saved-empty">No saved schemas yet</div>';
    return;
  }

  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var entry = urls[key];
    var item = document.createElement('div');
    item.className = 'saved-item';
    item.innerHTML = '<div class="saved-item-main" onclick="quickLoad(\'' + key.replace(/'/g, "\\'") + '\')">' +
      '<span class="saved-item-name">' + key + '</span>' +
      '<span class="saved-item-badge">' + entry.type + ':</span>' +
      '</div>' +
      '<button class="saved-item-del" title="Delete" onclick="deleteBtn(\'' + key.replace(/'/g, "\\'") + '\')" data-bs-toggle="modal" data-bs-target="#exampleModal"><i class="bi bi-x-lg"></i></button>';
    container.appendChild(item);
  }
}

function quickLoad(key) {
  if (!savedURLs[key]) return;
  var entry = savedURLs[key];
  // Set type first
  updateXsdType(entry.type);
  if (entry.type == 'custom') {
    document.getElementById("custom_xsdType").value = entry.customtype;
    xsdType = entry.customtype;
  }
  // Set URL field and fetch
  document.getElementById('inputURL').value = entry.url;
  document.getElementById('saveURL_name').value = key;
  fetchURL(entry.url);
}

function loadURL(url) {
  // Legacy compat — redirect to quickLoad
  quickLoad(url);
}

function deleteBtn(url) {
  updateModal("Delete URL?", "Do you want to delete this url from local storage?", url, "Avbryt", "Bekreft");
}

function deleteURL(url) {
  delete savedURLs[url];
  localStorage.setItem("savedURLs", JSON.stringify(savedURLs));
  updateDropdown(savedURLs);
}

function updateModal(label, body, callFunction, btnCancel, btnExecute) {
  document.getElementById("modalLabel").innerHTML = label;
  document.getElementById("modalBody").innerHTML = body;
  document.getElementById("modalBtnCancel").innerHTML = btnCancel || "Cancel";
  document.getElementById("modalBtnExecute").innerHTML = btnExecute || "Confirm";
  document.getElementById("modalBtnExecute").onclick = function () { deleteURL(callFunction); };
}

async function errorToUser(error) {
  var errorElement = document.getElementById("errorToUser");
  errorElement.innerHTML = '<i class="bi bi-exclamation-triangle-fill"></i>    ' + error;
  errorElement.removeAttribute("hidden");
  await new Promise(function (res) { setTimeout(res, 8000); });
  errorElement.setAttribute("hidden", "");
}
