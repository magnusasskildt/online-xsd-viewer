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
    document.getElementById('saveURL_name').value = '';
    document.getElementById('saveRow').hidden = true;
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

function clearAllSaved() {
  if (!confirm('Clear all saved URLs from local storage?')) return;
  localStorage.removeItem("savedURLs");
  savedURLs = {};
  updateDropdown(savedURLs);
}

function toggleSaveRow() {
  var row = document.getElementById('saveRow');
  row.hidden = !row.hidden;
  if (!row.hidden) {
    document.getElementById('saveURL_name').focus();
  }
}

function goHome() {
  // Reset state and show landing page
  rootNodeIndex = 0;
  Nodes = [{}];
  ComplexTypes = [{}];
  SimpleTypes = [{}];
  SchemaKeys = [];
  SchemaKeyRefs = [];
  GlobalElements = [];
  nLastClickedNodeIndex = 0;

  document.getElementById('SchemaOptions').setAttribute('hidden', '');
  document.getElementById('canvas-container').style.display = 'none';
  document.getElementById('detail-sidebar').classList.remove('open');
  document.getElementById('SearchResultDiv').setAttribute('hidden', '');
  document.getElementById('breadcrumb').innerHTML = '';
  document.getElementById('landing').removeAttribute('hidden');
}

function getNodeStyleHint(node) {
  var hints = [];
  var isRequired = node.minOccurs > 0;
  var isMultiple = node.maxOccurs > 1 || node.maxOccurs < 0;

  if (isRequired) {
    hints.push('Solid blue border \u2014 this field is required (minOccurs \u2265 1)');
  } else {
    hints.push('Dashed grey border \u2014 this field is optional (minOccurs = 0)');
  }

  if (isMultiple) {
    var maxStr = node.maxOccurs < 0 ? 'unbounded' : node.maxOccurs;
    hints.push('Stacked cards \u2014 can occur multiple times (max: ' + maxStr + ')');
  }

  return hints.join('\n');
}

function exportCanvasAsPNG() {
  if (!rootNodeIndex) return;

  // Calculate tree bounds
  var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (var i = 1; i < Nodes.length; i++) {
    var n = Nodes[i];
    if (n.visible === false || n.left === undefined) continue;
    minX = Math.min(minX, n.left);
    minY = Math.min(minY, n.top);
    maxX = Math.max(maxX, n.left + (n.totalWidth || n.width));
    maxY = Math.max(maxY, n.top + (n.totalHeight || n.height));
  }
  if (minX === Infinity) return;

  var padding = 60;
  var scale = 2; // 2x for sharp zoom
  var w = (maxX - minX) + padding * 2;
  var h = (maxY - minY) + padding * 2;

  var offscreen = document.createElement('canvas');
  offscreen.width = w * scale;
  offscreen.height = h * scale;
  var ctx = offscreen.getContext('2d');

  // Background
  var isDark = document.body.classList.contains('dark-mode');
  ctx.fillStyle = isDark ? '#1e1e2e' : '#fffaf1';
  ctx.fillRect(0, 0, offscreen.width, offscreen.height);

  // Translate so tree starts at padding
  ctx.scale(scale, scale);
  ctx.translate(padding - minX, padding - minY);

  DrawNode(ctx, rootNodeIndex, true);

  // Download
  var link = document.createElement('a');
  link.download = 'schema-tree.png';
  link.href = offscreen.toDataURL('image/png');
  link.click();
}
