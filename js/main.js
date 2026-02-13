// ===== MAIN INITIALIZATION =====

var canvas;
var canvasContainer;

function initApp() {
  canvas = document.getElementById("tree");
  canvasContainer = document.getElementById("canvas-container");

  resizeCanvasToContainer();

  document.getElementById('SearchReset').setAttribute("hidden", "");

  // Setup camera (zoom/pan)
  setupCameraEvents();

  // Search enter key
  document.getElementById('SearchText').addEventListener("keyup", function (event) {
    event.preventDefault();
    if (event.keyCode == 13) SearchButtonPressed();
  });

  // Load saved URLs
  savedURLs = JSON.parse(localStorage.getItem("savedURLs")) || {};
  if (Object.keys(savedURLs).length < 2) {
    savedURLs = getDefaultSavedURLs();
    localStorage.setItem("savedURLs", JSON.stringify(savedURLs));
  }
  updateDropdown(savedURLs);

  // Resize handler
  window.addEventListener('resize', function () {
    resizeCanvasToContainer();
    if (rootNodeIndex) DrawTree();
  });

  // Pan mode button
  var panBtn = document.getElementById('pan-btn');
  if (panBtn) {
    panBtn.addEventListener('click', function () {
      isPanMode = !isPanMode;
      panBtn.classList.toggle('active', isPanMode);
      canvas.style.cursor = isPanMode ? 'grab' : 'default';
    });
  }

  // Fit to content button
  var fitBtn = document.getElementById('fit-btn');
  if (fitBtn) {
    fitBtn.addEventListener('click', function () {
      fitToContent();
      DrawTree();
      updateZoomDisplay();
    });
  }

  // Zoom buttons
  var zoomInBtn = document.getElementById('zoom-in-btn');
  if (zoomInBtn) {
    zoomInBtn.addEventListener('click', function () {
      camera.zoom = Math.min(camera.zoom * 1.2, camera.maxZoom);
      DrawTree();
      updateZoomDisplay();
    });
  }
  var zoomOutBtn = document.getElementById('zoom-out-btn');
  if (zoomOutBtn) {
    zoomOutBtn.addEventListener('click', function () {
      camera.zoom = Math.max(camera.zoom / 1.2, camera.minZoom);
      DrawTree();
      updateZoomDisplay();
    });
  }

  // Expand/Collapse all
  var expandBtn = document.getElementById('expand-all-btn');
  if (expandBtn) {
    expandBtn.addEventListener('click', function () {
      if (rootNodeIndex) {
        SetNodesExpanded(rootNodeIndex, true, 99);
        CalcNodePositions();
        DrawTree();
      }
    });
  }
  var collapseBtn = document.getElementById('collapse-all-btn');
  if (collapseBtn) {
    collapseBtn.addEventListener('click', function () {
      if (rootNodeIndex) {
        SetAllNodesCollapsed(rootNodeIndex);
        Nodes[rootNodeIndex].expanded = true;
        CalcNodePositions();
        DrawTree();
      }
    });
  }

  // Reset view
  var resetBtn = document.getElementById('reset-view-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      if (rootNodeIndex) {
        resetView();
        updateZoomDisplay();
        DrawTree();
      }
    });
  }

  // Dark mode
  var darkBtn = document.getElementById('dark-mode-btn');
  if (darkBtn) {
    var isDark = localStorage.getItem('schemaviewer_darkmode') === 'true';
    if (isDark) document.body.classList.add('dark-mode');
    darkBtn.addEventListener('click', function () {
      document.body.classList.toggle('dark-mode');
      var active = document.body.classList.contains('dark-mode');
      localStorage.setItem('schemaviewer_darkmode', active);
      if (rootNodeIndex) DrawTree();
    });
  }

  // Help overlay
  var helpBtn = document.getElementById('help-btn');
  var helpOverlay = document.getElementById('help-overlay');
  if (helpBtn && helpOverlay) {
    helpBtn.addEventListener('click', function () {
      helpOverlay.hidden = !helpOverlay.hidden;
    });
    helpOverlay.addEventListener('click', function (e) {
      if (e.target === helpOverlay) helpOverlay.hidden = true;
    });
  }
}

// ===== CHECKBOX HANDLERS =====

function AnnotationChanged() {
  bShowAnnotations = document.getElementById("cbAnnotations").checked;
  CalcNodePositions();
  DrawTree();
}

function TypeInfoChanged() {
  bShowTypeInfo = document.getElementById("cbTypeInfo").checked;
  CalcNodePositions();
  DrawTree();
}

// ===== BREADCRUMB =====

function updateBreadcrumb(nodeIndex) {
  var el = document.getElementById('breadcrumb');
  if (!el) return;

  if (!nodeIndex) {
    el.innerHTML = '';
    return;
  }

  var path = [];
  var idx = nodeIndex;
  while (idx != null) {
    if (IsRealNode(Nodes[idx].type) && Nodes[idx].name) {
      path.unshift(idx);
    }
    idx = Nodes[idx].parentIndex;
  }

  var html = '';
  for (var i = 0; i < path.length; i++) {
    if (i > 0) html += ' <span class="breadcrumb-sep">/</span> ';
    var cls = (i === path.length - 1) ? 'breadcrumb-item active' : 'breadcrumb-item';
    html += '<span class="' + cls + '" data-node="' + path[i] + '" onclick="breadcrumbClick(' + path[i] + ')">' + Nodes[path[i]].name + '</span>';
  }
  el.innerHTML = html;
}

function breadcrumbClick(nodeIndex) {
  if (nodeIndex && Nodes[nodeIndex]) {
    nLastClickedNodeIndex = nodeIndex;
    // Navigate camera to node
    camera.x = Nodes[nodeIndex].left + Nodes[nodeIndex].width / 2;
    camera.y = Nodes[nodeIndex].verCenter;
    updateBreadcrumb(nodeIndex);
    updateSidebar(nodeIndex);
    DrawTree();
  }
}

// ===== SIDEBAR NODE DETAILS =====

function getExampleValue(node) {
  var base = node.baseTypeName || node.typeName || '';
  if (base.indexOf(':string') >= 0) return 'text';
  if (base.indexOf(':int') >= 0 || base.indexOf(':integer') >= 0 || base.indexOf(':nonNegativeInteger') >= 0) return '1';
  if (base.indexOf(':decimal') >= 0) return '100.00';
  if (base.indexOf(':boolean') >= 0) return 'true';
  if (base.indexOf(':date') >= 0 && base.indexOf(':dateTime') < 0) return '2025-01-15';
  if (base.indexOf(':dateTime') >= 0) return '2025-01-15T10:30:00';
  if (base.indexOf(':time') >= 0) return '10:30:00';
  if (base.indexOf(':anyURI') >= 0) return 'https://example.com';
  if (node.enumeration && node.enumeration.length > 0) return node.enumeration[0];
  if (node.pattern) return node.pattern;
  return '...';
}

function getParentElements(nodeIndex, maxParents) {
  var parents = [];
  var idx = nodeIndex;
  while (idx && parents.length < maxParents) {
    var parentIdx = Nodes[idx].parentIndex;
    if (parentIdx && Nodes[parentIdx]) {
      if (IsRealNode(Nodes[parentIdx].type)) {
        parents.unshift(Nodes[parentIdx].name);
      }
      idx = parentIdx;
    } else {
      break;
    }
  }
  return parents;
}

function generateXmlExample(nodeIndex) {
  var node = Nodes[nodeIndex];
  if (!node || !node.name) return '';

  var parents = getParentElements(nodeIndex, 2);
  var indent = '';
  var lines = [];

  // Opening parent tags
  for (var p = 0; p < parents.length; p++) {
    lines.push(indent + '<' + parents[p] + '>');
    indent += '  ';
  }

  // The node itself
  var hasChildren = node.firstChildIndex && node.type == NodeTypeComplex;

  if (hasChildren) {
    lines.push(indent + '<' + node.name + '>');
    // Show a few child elements as hints
    var childIdx = node.firstChildIndex;
    var childIndent = indent + '  ';
    var childCount = 0;
    while (childIdx && childCount < 3) {
      var child = Nodes[childIdx];
      if (IsRealNode(child.type) && child.name) {
        var childHasChildren = child.firstChildIndex && child.type == NodeTypeComplex;
        if (childHasChildren) {
          lines.push(childIndent + '<' + child.name + '>\u2026</' + child.name + '>');
        } else {
          lines.push(childIndent + '<' + child.name + '>' + getExampleValue(child) + '</' + child.name + '>');
        }
        childCount++;
      } else if (!IsRealNode(child.type)) {
        // Structural node — peek into its children
        var grandIdx = child.firstChildIndex;
        while (grandIdx && childCount < 3) {
          var grand = Nodes[grandIdx];
          if (IsRealNode(grand.type) && grand.name) {
            var grandHasChildren = grand.firstChildIndex && grand.type == NodeTypeComplex;
            if (grandHasChildren) {
              lines.push(childIndent + '<' + grand.name + '>\u2026</' + grand.name + '>');
            } else {
              lines.push(childIndent + '<' + grand.name + '>' + getExampleValue(grand) + '</' + grand.name + '>');
            }
            childCount++;
          }
          grandIdx = grand.nextIndex;
        }
      }
      childIdx = child.nextIndex;
    }
    // Check if there are more children
    if (childIdx) {
      lines.push(childIndent + '\u2026');
    }
    lines.push(indent + '</' + node.name + '>');
  } else {
    lines.push(indent + '<' + node.name + '>' + getExampleValue(node) + '</' + node.name + '>');
  }

  // Closing parent tags
  for (var p = parents.length - 1; p >= 0; p--) {
    indent = '';
    for (var s = 0; s < p; s++) indent += '  ';
    lines.push(indent + '</' + parents[p] + '>');
  }

  return lines.join('\n');
}

function updateSidebar(nodeIndex) {
  var sidebar = document.getElementById('detail-sidebar');
  if (!sidebar) return;

  if (!nodeIndex || !Nodes[nodeIndex]) {
    sidebar.classList.remove('open');
    return;
  }

  var node = Nodes[nodeIndex];
  var nodeType = node.type;

  // Structural nodes (sequence, choice, all) get a simplified sidebar
  if (!IsRealNode(nodeType)) {
    sidebar.classList.add('open');

    var structName = '';
    var structDesc = '';
    if (nodeType == NodeTypeSequence) {
      structName = 'Sequence';
      structDesc = 'Child elements must appear in the exact order shown. All children in this group are expected in sequence.';
    } else if (nodeType == NodeTypeChoice) {
      structName = 'Choice';
      structDesc = 'Exactly one of the child elements must be present. Only one option from this group can be used.';
    } else if (nodeType == NodeTypeAll) {
      structName = 'All';
      structDesc = 'All child elements may appear in any order, but each at most once.';
    }

    document.getElementById('sb-name').textContent = structName;
    document.getElementById('sb-xpath').textContent = '';
    document.getElementById('sb-style-row').style.display = 'none';

    // Occurrences on the structural node itself
    var occEl = document.getElementById('sb-occ');
    var occRow = document.getElementById('sb-occ-row');
    if (node.minOccurs !== undefined) {
      var maxStr = (node.maxOccurs < 0) ? 'unbounded' : node.maxOccurs;
      occEl.textContent = node.minOccurs + '..' + maxStr;
      occRow.style.display = '';
    } else {
      occRow.style.display = 'none';
    }

    document.getElementById('sb-type-row').style.display = 'none';
    document.getElementById('sb-pattern-row').style.display = 'none';
    document.getElementById('sb-attr-row').style.display = 'none';
    document.getElementById('sb-enum-row').style.display = 'none';
    document.getElementById('sb-digits-row').style.display = 'none';
    document.getElementById('sb-range-row').style.display = 'none';
    document.getElementById('sb-keys-row').style.display = 'none';
    document.getElementById('sb-keyrefs-row').style.display = 'none';

    // Show annotation if present, otherwise show the structural description
    var annoText = '';
    if (node.annotationLines) annoText = node.annotationLines.join('\n');
    else if (node.annotation) annoText = node.annotation;
    if (!annoText) annoText = structDesc;
    document.getElementById('sb-anno').textContent = annoText;
    document.getElementById('sb-anno-row').style.display = '';

    // Hide example for structural nodes
    document.getElementById('sb-example-row').style.display = 'none';

    return;
  }

  sidebar.classList.add('open');

  document.getElementById('sb-name').textContent = node.name || '';
  document.getElementById('sb-xpath').textContent = XPath(nodeIndex);

  // Style hint
  var styleHint = getNodeStyleHint(node);
  document.getElementById('sb-style').textContent = styleHint;
  document.getElementById('sb-style-row').style.display = styleHint ? '' : 'none';

  // Type
  document.getElementById('sb-type').textContent = node.typeDescription || '';
  document.getElementById('sb-type-row').style.display = node.typeDescription ? '' : 'none';

  // Pattern
  document.getElementById('sb-pattern').textContent = node.pattern || '';
  document.getElementById('sb-pattern-row').style.display = node.pattern ? '' : 'none';

  // Annotation
  var annoText = '';
  if (node.annotationLines) annoText = node.annotationLines.join('\n');
  else if (node.annotation) annoText = node.annotation;

  // Add note for recursive types and anyType (shown as "..." dots in the tree)
  if (node.recursiveType) {
    var recursiveNote = 'This element references its own type (' + node.typeName + ') higher in the tree, creating a recursive structure. Shown as \u2026 in the diagram.';
    annoText = annoText ? annoText + '\n\n' + recursiveNote : recursiveNote;
  } else if (node.typeName == xsdType + ':anyType' || node.baseTypeName == xsdType + ':anyType') {
    var anyNote = 'This element accepts any content (anyType). Shown as \u2026 in the diagram.';
    annoText = annoText ? annoText + '\n\n' + anyNote : anyNote;
  }

  document.getElementById('sb-anno').textContent = annoText;
  document.getElementById('sb-anno-row').style.display = annoText ? '' : 'none';

  // Attributes
  var attrEl = document.getElementById('sb-attr');
  var attrRow = document.getElementById('sb-attr-row');
  if (node.attributes && node.attributes.length > 0) {
    var html = '';
    for (var i = 0; i < node.attributes.length; i++) {
      var a = node.attributes[i];
      html += '<div><span class="sb-attr-name">' + a.name + '</span>: ' + (a.type || '') + (a.use ? ' [' + a.use + ']' : '') + '</div>';
    }
    attrEl.innerHTML = html;
    attrRow.style.display = '';
  } else {
    attrRow.style.display = 'none';
  }

  // Enumeration
  var enumEl = document.getElementById('sb-enum');
  var enumRow = document.getElementById('sb-enum-row');
  if (node.enumeration && node.enumeration.length > 0) {
    enumEl.textContent = node.enumeration.join(', ');
    enumRow.style.display = '';
  } else {
    enumRow.style.display = 'none';
  }

  // Digits (totalDigits / fractionDigits)
  var digitsEl = document.getElementById('sb-digits');
  var digitsRow = document.getElementById('sb-digits-row');
  if (node.totalDigits) {
    var digitsText = node.totalDigits + ' total digits';
    if (node.fractionDigits) digitsText += ', ' + node.fractionDigits + ' decimals';
    digitsEl.textContent = digitsText;
    digitsRow.style.display = '';
  } else {
    digitsRow.style.display = 'none';
  }

  // Range (minInclusive/maxInclusive/minExclusive/maxExclusive)
  var rangeEl = document.getElementById('sb-range');
  var rangeRow = document.getElementById('sb-range-row');
  var hasRange = node.minInclusive || node.maxInclusive || node.minExclusive || node.maxExclusive;
  if (hasRange) {
    var rangeMin = node.minInclusive || node.minExclusive;
    var rangeMax = node.maxInclusive || node.maxExclusive;
    var minBracket = node.minInclusive ? '[' : '(';
    var maxBracket = node.maxInclusive ? ']' : ')';
    rangeEl.textContent = minBracket + (rangeMin || '') + ' .. ' + (rangeMax || '') + maxBracket;
    rangeRow.style.display = '';
  } else {
    rangeRow.style.display = 'none';
  }

  // Keys & KeyRefs for this node's xpath
  var keysEl = document.getElementById('sb-keys');
  var keysRow = document.getElementById('sb-keys-row');
  var keyrefsEl = document.getElementById('sb-keyrefs');
  var keyrefsRow = document.getElementById('sb-keyrefs-row');
  var xpath = XPath(nodeIndex);
  var matchingKeys = [];
  var matchingRefs = [];

  for (var k = 0; k < SchemaKeys.length; k++) {
    if (SchemaKeys[k].field && xpath.indexOf(SchemaKeys[k].field) >= 0)
      matchingKeys.push(SchemaKeys[k]);
    else if (SchemaKeys[k].selector && xpath.indexOf(SchemaKeys[k].selector.replace(/\.\//g, '/')) >= 0)
      matchingKeys.push(SchemaKeys[k]);
  }
  for (var r = 0; r < SchemaKeyRefs.length; r++) {
    if (SchemaKeyRefs[r].field && xpath.indexOf(SchemaKeyRefs[r].field) >= 0)
      matchingRefs.push(SchemaKeyRefs[r]);
    else if (SchemaKeyRefs[r].selector && xpath.indexOf(SchemaKeyRefs[r].selector.replace(/\.\//g, '/')) >= 0)
      matchingRefs.push(SchemaKeyRefs[r]);
  }

  if (matchingKeys.length > 0) {
    var keysHtml = '';
    for (var ki = 0; ki < matchingKeys.length; ki++) {
      keysHtml += '<div><span class="sb-attr-name">' + matchingKeys[ki].name + '</span>';
      if (matchingKeys[ki].field) keysHtml += ' (' + matchingKeys[ki].field + ')';
      keysHtml += '</div>';
    }
    keysEl.innerHTML = keysHtml;
    keysRow.style.display = '';
  } else {
    keysRow.style.display = 'none';
  }

  if (matchingRefs.length > 0) {
    var refsHtml = '';
    for (var ri = 0; ri < matchingRefs.length; ri++) {
      refsHtml += '<div><span class="sb-attr-name">' + matchingRefs[ri].name + '</span>';
      refsHtml += ' \u2192 ' + matchingRefs[ri].refer;
      if (matchingRefs[ri].field) refsHtml += ' (' + matchingRefs[ri].field + ')';
      refsHtml += '</div>';
    }
    keyrefsEl.innerHTML = refsHtml;
    keyrefsRow.style.display = '';
  } else {
    keyrefsRow.style.display = 'none';
  }

  // Occurrences
  var occEl = document.getElementById('sb-occ');
  var occRow = document.getElementById('sb-occ-row');
  if (node.minOccurs !== undefined) {
    var maxStr = (node.maxOccurs < 0) ? 'unbounded' : node.maxOccurs;
    occEl.textContent = node.minOccurs + '..' + maxStr;
    occRow.style.display = '';
  } else {
    occRow.style.display = 'none';
  }

  // XML Example
  var exampleEl = document.getElementById('sb-example');
  var exampleRow = document.getElementById('sb-example-row');
  var exampleText = generateXmlExample(nodeIndex);
  if (exampleText) {
    exampleEl.textContent = exampleText;
    exampleRow.style.display = '';
  } else {
    exampleRow.style.display = 'none';
  }
}

// ===== NODE CLICK HANDLING =====

function NodeClicked(nodeIndex, showDetails) {
  nLastClickedNodeIndex = nodeIndex;
  nLastExpandedNodeIndex = null;

  if (nodeIndex) {
    var firstChildIndex = Nodes[nodeIndex].firstChildIndex;
    if (firstChildIndex) {
      if (Nodes[nodeIndex].expanded) {
        Nodes[nodeIndex].expanded = false;
        nLastCollapsedNodeIndex = nodeIndex;
      } else {
        Nodes[nodeIndex].expanded = true;
        nLastExpandedNodeIndex = nodeIndex;
        var nodeType = Nodes[firstChildIndex].type;
        if ((nodeType == NodeTypeChoice || nodeType == NodeTypeSequence || nodeType == NodeTypeAll) && Nodes[firstChildIndex].firstChildIndex) {
          Nodes[firstChildIndex].expanded = true;
          nLastExpandedNodeIndex = firstChildIndex;
        }
        ExpandChoiceNodes(nLastExpandedNodeIndex);
      }
      CalcNodePositions();
    }

    // Always update sidebar and breadcrumb
    updateBreadcrumb(nodeIndex);
    updateSidebar(nodeIndex);
  } else {
    updateBreadcrumb(null);
    updateSidebar(null);
  }

  DrawTree();
}

// ===== DRAW TREE (camera-based) =====

function DrawTree() {
  if (!rootNodeIndex || !canvas) return;

  var ctx = canvas.getContext("2d");
  var dpr = window.devicePixelRatio || 1;
  var viewW = canvas.width / dpr;
  var viewH = canvas.height / dpr;

  console.log('[DrawTree] dpr=' + dpr + ' canvas.width=' + canvas.width + ' canvas.height=' + canvas.height + ' viewW=' + viewW + ' viewH=' + viewH + ' camera:', JSON.stringify(camera));

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // Clear with background
  var isDark = document.body.classList.contains('dark-mode');
  ctx.fillStyle = isDark ? '#1e1e2e' : '#fffaf1';
  ctx.fillRect(0, 0, viewW, viewH);

  // Apply camera transform (like fabrikkspill)
  ctx.save();
  ctx.translate(viewW / 2, viewH / 2);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x, -camera.y);

  DrawNode(ctx, rootNodeIndex, true);

  ctx.restore();
}

// ===== LOAD SCHEMA =====

function LoadSchema(data) {
  if (!document.getElementById("custom_xsdType").hasAttribute("disabled")) {
    xsdType = document.getElementById("custom_xsdType").value;
  }

  if (rootNodeIndex) return;

  ComplexTypes = [{}];
  SimpleTypes = [{}];
  SchemaKeys = [];
  SchemaKeyRefs = [];
  GlobalElements = [];
  Nodes = [{}];

  var textarea;
  if (data == undefined) {
    textarea = document.getElementById("schema-text").value;
  } else {
    textarea = data;
  }

  if (textarea.search(xsdType + ':') < 1) {
    errorToUser("Can't find <b>" + xsdType + ":</b> in the file. Please check your file or type settings.");
    return;
  }

  document.getElementById("landing").setAttribute("hidden", "");

  var parser = new DOMParser();
  var xmlDoc;
  try {
    xmlDoc = parser.parseFromString(textarea, "text/xml");
  } catch (e) {
    alert("Not a valid xml document");
    return false;
  }

  var schemaNode = GetFirstChildNode(xmlDoc, xsdType + ':schema');

  LoadSimpleTypes(schemaNode);
  LoadComplexTypes(schemaNode);
  LoadGlobalElements(schemaNode);

  var rootNode = GetFirstChildNode(schemaNode, xsdType + ':element');
  bResolveComplexTypes = true;
  rootNodeIndex = AddNode(rootNode);

  // Load key/keyref constraints
  SchemaKeys = LoadKeys(rootNode);
  SchemaKeyRefs = LoadKeyRefs(rootNode);

  document.getElementById('SchemaOptions').removeAttribute("hidden");
  canvasContainer.style.display = 'flex';

  // Resize canvas now that container is visible
  resizeCanvasToContainer();
  console.log('[LoadSchema] after resize: canvas.width=' + canvas.width + ' canvas.height=' + canvas.height + ' container:', canvasContainer.clientWidth, 'x', canvasContainer.clientHeight);

  // Size nodes and layout
  var sizeCtx = canvas.getContext("2d");
  sizeCtx.font = sNodeNameFont;
  SetNodeSize(sizeCtx, rootNodeIndex, true);

  SetNodesExpanded(rootNodeIndex, true, 2);
  CalcNodePositions();

  // Start with zoom 1.0 centered on root node
  resetView();
  updateZoomDisplay();

  DrawTree();
}

// ===== BOOTSTRAP =====

document.addEventListener("DOMContentLoaded", initApp);
