// ===== SEARCH =====

function SearchSubTree(nodeIndex) {
  var matching = false;

  if (IsRealNode(Nodes[nodeIndex].type)) {
    var nodeName = Nodes[nodeIndex].name;
    if (nodeName && nodeName.toLowerCase().search(lastSearchText) >= 0)
      matching = true;
  }

  var annotation = Nodes[nodeIndex].annotation;
  if (!matching && annotation)
    if (annotation.toLowerCase().search(lastSearchText) >= 0)
      matching = true;

  if (matching) {
    if (SearchResults.length >= nMaxSearchResults)
      bTooManySearchResults = true;
    else
      SearchResults.push(nodeIndex);
  }

  var nextNodeIndex = Nodes[nodeIndex].firstChildIndex;
  while (nextNodeIndex && !bTooManySearchResults) {
    SearchSubTree(nextNodeIndex);
    nextNodeIndex = Nodes[nextNodeIndex].nextIndex;
  }
}

function SearchButtonPressed() {
  var searchText = document.getElementById('SearchText');
  var searchResultDiv = document.getElementById('SearchResultDiv');
  var searchResetButton = document.getElementById('SearchReset');
  var tooManyResults = document.getElementById('TooManyResults');
  var searchResultElement;
  var nodeIndex, i;
  var bDisplayResultTable = false;

  lastSearchText = searchText.value.trim().toLowerCase();

  SearchResults = [];
  bTooManySearchResults = false;
  searchResultDiv.scrollTop = 0;

  // Generate search result rows dynamically
  var searchTable = searchResultDiv.querySelector('table');
  searchTable.innerHTML = '';

  if (lastSearchText.length > 2) {
    SearchSubTree(rootNodeIndex);
    bDisplayResultTable = true;
    searchResetButton.removeAttribute("hidden");
  } else {
    errorToUser("You can only search for words 3 characters or longer");
  }

  for (i = 0; i < SearchResults.length; i++) {
    var tr = document.createElement('tr');
    tr.className = 'search-result';
    tr.setAttribute('data-index', i);
    tr.onclick = (function(idx) { return function() { SearchResultClicked(idx); }; })(i);
    var td = document.createElement('td');
    td.className = 'xpath btn btn-link float-start';
    nodeIndex = SearchResults[i];
    td.textContent = XPath(nodeIndex).replace(/\//g, ' / ');
    tr.appendChild(td);
    searchTable.appendChild(tr);
  }

  if (bTooManySearchResults) {
    var trTooMany = document.createElement('tr');
    trTooMany.className = 'search-result';
    var tdTooMany = document.createElement('td');
    tdTooMany.className = 'xpath';
    tdTooMany.textContent = 'Too many results found';
    trTooMany.appendChild(tdTooMany);
    searchTable.appendChild(trTooMany);
  }

  if (bDisplayResultTable) {
    if (SearchResults.length == 0) {
      var trNone = document.createElement('tr');
      trNone.className = 'search-result';
      var tdNone = document.createElement('td');
      tdNone.className = 'xpath btn btn-link float-start';
      tdNone.textContent = 'No results found for this search text ...';
      trNone.appendChild(tdNone);
      searchTable.appendChild(trNone);
    }
    searchResultDiv.removeAttribute("hidden");
  } else {
    searchResultDiv.setAttribute("hidden", "");
  }

  DrawTree();
}

function SetAllNodesCollapsed(nodeIndex) {
  Nodes[nodeIndex].expanded = false;
  var nextNodeIndex = Nodes[nodeIndex].firstChildIndex;
  while (nextNodeIndex) {
    SetAllNodesCollapsed(nextNodeIndex);
    nextNodeIndex = Nodes[nextNodeIndex].nextIndex;
  }
}

function SetPathExpanded(nodeIndex) {
  if (Nodes[nodeIndex].firstChildIndex)
    Nodes[nodeIndex].expanded = true;
  var parentIndex = Nodes[nodeIndex].parentIndex;
  if (parentIndex)
    SetPathExpanded(parentIndex);
}

function SearchResultClicked(index) {
  if (index >= 0 && index < SearchResults.length) {
    var nodeIndex = SearchResults[index];
    SetAllNodesCollapsed(rootNodeIndex);
    SetPathExpanded(nodeIndex);
    SetVerNodePositions();
    MoveNodeToCenter(nodeIndex);
    if (Nodes[nodeIndex].firstChildIndex)
      Nodes[nodeIndex].expanded = false;
    SetVerNodePositions();
    NodeClicked(nodeIndex, false);
  }
}

function SearchResetPressed() {
  document.getElementById('SearchText').value = '';
  SearchResults = [];
  document.getElementById('SearchResultDiv').setAttribute("hidden", "");
  document.getElementById('SearchReset').setAttribute("hidden", "");
  DrawTree();
}
