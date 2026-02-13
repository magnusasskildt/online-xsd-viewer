// ===== CAMERA (ZOOM & PAN) =====

var camera = {
  x: 0,
  y: 0,
  zoom: 1.0,
  minZoom: 0.15,
  maxZoom: 3.0,
  zoomStep: 0.1
};

var isDragging = false;
var dragStart = { x: 0, y: 0 };
var isPanMode = false;

function screenToWorld(screenX, screenY) {
  var rect = canvas.getBoundingClientRect();
  var canvasX = (screenX - rect.left);
  var canvasY = (screenY - rect.top);
  var viewW = rect.width;
  var viewH = rect.height;
  return {
    x: (canvasX - viewW / 2) / camera.zoom + camera.x,
    y: (canvasY - viewH / 2) / camera.zoom + camera.y
  };
}

function worldToScreen(worldX, worldY) {
  var rect = canvas.getBoundingClientRect();
  return {
    x: (worldX - camera.x) * camera.zoom + rect.width / 2,
    y: (worldY - camera.y) * camera.zoom + rect.height / 2
  };
}

function initCamera() {
  if (rootNodeIndex && Nodes[rootNodeIndex]) {
    var node = Nodes[rootNodeIndex];
    camera.x = (node.left + node.width / 2);
    camera.y = nSchemaHeight / 2;
  } else {
    camera.x = nCanvasWidth / 2;
    camera.y = nCanvasHeight / 2;
  }
  camera.zoom = 1.0;
}

function fitToContent() {
  if (!rootNodeIndex) return;

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

  var dpr = window.devicePixelRatio || 1;
  var viewW = canvas.width / dpr;
  var viewH = canvas.height / dpr;

  var padding = 40;
  var contentW = (maxX - minX) + padding * 2;
  var contentH = (maxY - minY) + padding * 2;

  var zoomX = viewW / contentW;
  var zoomY = viewH / contentH;
  camera.zoom = Math.min(zoomX, zoomY, camera.maxZoom);
  camera.zoom = Math.max(camera.zoom, camera.minZoom);

  camera.x = (minX + maxX) / 2;
  camera.y = (minY + maxY) / 2;
}

// --- Hit testing: did click land on the expander circle? ---
function isExpanderHit(nodeIndex, wx, wy) {
  var node = Nodes[nodeIndex];
  if (!node.firstChildIndex) return false;

  var ex, ey;
  if (node.type == NodeTypeChoice || node.type == NodeTypeSequence) {
    ex = node.expHorCenter;
  } else {
    ex = node.right + nExpanderDistance + nExpanderRadius;
  }
  ey = node.verCenter;

  var dx = wx - ex;
  var dy = wy - ey;
  // Generous hit area (radius + 4px)
  return (dx * dx + dy * dy) <= (nExpanderRadius + 4) * (nExpanderRadius + 4);
}

function setupCameraEvents() {
  // Wheel zoom
  canvas.addEventListener('wheel', function (e) {
    e.preventDefault();
    var worldBefore = screenToWorld(e.clientX, e.clientY);

    var direction = e.deltaY > 0 ? -1 : 1;
    var factor = 1 + camera.zoomStep;
    if (direction > 0) camera.zoom *= factor;
    else camera.zoom /= factor;
    camera.zoom = Math.max(camera.minZoom, Math.min(camera.maxZoom, camera.zoom));

    var worldAfter = screenToWorld(e.clientX, e.clientY);
    camera.x += worldBefore.x - worldAfter.x;
    camera.y += worldBefore.y - worldAfter.y;

    DrawTree();
    updateZoomDisplay();
  }, { passive: false });

  // Mouse drag pan + click
  var mouseDownPos = null;
  var didDrag = false;

  canvas.addEventListener('mousedown', function (e) {
    if (e.button === 1 || e.button === 0) {
      isDragging = true;
      didDrag = false;
      dragStart = { x: e.clientX, y: e.clientY };
      mouseDownPos = { x: e.clientX, y: e.clientY };
      if (e.button === 1 || isPanMode || e.shiftKey) {
        canvas.style.cursor = 'grabbing';
      }
      e.preventDefault();
    }
  });

  canvas.addEventListener('mousemove', function (e) {
    if (isDragging) {
      var dx = e.clientX - dragStart.x;
      var dy = e.clientY - dragStart.y;

      if (!didDrag && (Math.abs(e.clientX - mouseDownPos.x) > 3 || Math.abs(e.clientY - mouseDownPos.y) > 3)) {
        didDrag = true;
        canvas.style.cursor = 'grabbing';
      }

      if (didDrag) {
        camera.x -= dx / camera.zoom;
        camera.y -= dy / camera.zoom;
        dragStart = { x: e.clientX, y: e.clientY };
        DrawTree();
      }
    } else {
      var world = screenToWorld(e.clientX, e.clientY);
      var nodeIndex = getNodeAtWorld(world.x, world.y);
      if (nodeIndex && isExpanderHit(nodeIndex, world.x, world.y)) {
        canvas.style.cursor = 'pointer';
      } else if (nodeIndex) {
        canvas.style.cursor = 'pointer';
      } else {
        canvas.style.cursor = isPanMode ? 'grab' : 'default';
      }
    }
  });

  canvas.addEventListener('mouseup', function (e) {
    if (isDragging) {
      isDragging = false;
      canvas.style.cursor = isPanMode ? 'grab' : 'default';

      if (!didDrag && e.button === 0) {
        var world = screenToWorld(e.clientX, e.clientY);
        var nodeIndex = getNodeAtWorld(world.x, world.y);
        handleNodeInteraction(nodeIndex, world.x, world.y);
      }
    }
  });

  canvas.addEventListener('mouseleave', function () {
    isDragging = false;
  });

  // Touch support
  var lastTouchDist = 0;
  var lastTouchCenter = { x: 0, y: 0 };
  var touchDragging = false;
  var touchStartPos = null;

  canvas.addEventListener('touchstart', function (e) {
    if (e.touches.length === 2) {
      e.preventDefault();
      touchDragging = false;
      lastTouchDist = getTouchDistance(e.touches[0], e.touches[1]);
      lastTouchCenter = getTouchCenter(e.touches[0], e.touches[1]);
    } else if (e.touches.length === 1) {
      touchDragging = true;
      dragStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      touchStartPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }, { passive: false });

  canvas.addEventListener('touchmove', function (e) {
    if (e.touches.length === 2) {
      e.preventDefault();
      var dist = getTouchDistance(e.touches[0], e.touches[1]);
      var center = getTouchCenter(e.touches[0], e.touches[1]);

      var scale = dist / lastTouchDist;
      camera.zoom *= scale;
      camera.zoom = Math.max(camera.minZoom, Math.min(camera.maxZoom, camera.zoom));

      camera.x -= (center.x - lastTouchCenter.x) / camera.zoom;
      camera.y -= (center.y - lastTouchCenter.y) / camera.zoom;

      lastTouchDist = dist;
      lastTouchCenter = center;
      DrawTree();
      updateZoomDisplay();
    } else if (e.touches.length === 1 && touchDragging) {
      var dx = e.touches[0].clientX - dragStart.x;
      var dy = e.touches[0].clientY - dragStart.y;
      camera.x -= dx / camera.zoom;
      camera.y -= dy / camera.zoom;
      dragStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      touchStartPos = null; // moved, not a tap
      DrawTree();
    }
  }, { passive: false });

  canvas.addEventListener('touchend', function (e) {
    if (e.touches.length === 0) {
      // Tap detection
      if (touchStartPos && touchDragging) {
        var world = screenToWorld(touchStartPos.x, touchStartPos.y);
        var nodeIndex = getNodeAtWorld(world.x, world.y);
        handleNodeInteraction(nodeIndex, world.x, world.y);
      }
      touchDragging = false;
      touchStartPos = null;
    }
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', function (e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.key === '+' || e.key === '=') {
      camera.zoom = Math.min(camera.zoom * 1.15, camera.maxZoom);
      DrawTree(); updateZoomDisplay();
    }
    if (e.key === '-') {
      camera.zoom = Math.max(camera.zoom / 1.15, camera.minZoom);
      DrawTree(); updateZoomDisplay();
    }
    if (e.key === '0') {
      fitToContent(); DrawTree(); updateZoomDisplay();
    }
    if (e.key === 'h' || e.key === 'H') {
      isPanMode = !isPanMode;
      canvas.style.cursor = isPanMode ? 'grab' : 'default';
      var panBtn = document.getElementById('pan-btn');
      if (panBtn) panBtn.classList.toggle('active', isPanMode);
    }
  });
}

// --- Separated interaction: click on expander = toggle, click on node = select ---
function handleNodeInteraction(nodeIndex, wx, wy) {
  if (!nodeIndex) {
    // Clicked empty space — deselect
    nLastClickedNodeIndex = null;
    updateBreadcrumb(null);
    updateSidebar(null);
    DrawTree();
    return;
  }

  if (isExpanderHit(nodeIndex, wx, wy)) {
    // Toggle expand/collapse only
    ExpandCollapseNode(nodeIndex);
  } else {
    // Select node — show sidebar, no expand/collapse
    nLastClickedNodeIndex = nodeIndex;
    updateBreadcrumb(nodeIndex);
    updateSidebar(nodeIndex);
    DrawTree();
  }
}

function ExpandCollapseNode(nodeIndex) {
  nLastExpandedNodeIndex = null;

  var firstChildIndex = Nodes[nodeIndex].firstChildIndex;
  if (!firstChildIndex) return;

  if (Nodes[nodeIndex].expanded) {
    Nodes[nodeIndex].expanded = false;
    nLastCollapsedNodeIndex = nodeIndex;
  } else {
    Nodes[nodeIndex].expanded = true;
    nLastExpandedNodeIndex = nodeIndex;
    var nodeType = Nodes[firstChildIndex].type;
    if ((nodeType == NodeTypeChoice || nodeType == NodeTypeSequence) && Nodes[firstChildIndex].firstChildIndex) {
      Nodes[firstChildIndex].expanded = true;
      nLastExpandedNodeIndex = firstChildIndex;
    }
    ExpandChoiceNodes(nLastExpandedNodeIndex);
  }

  CalcNodePositions();
  DrawTree();
}

function getNodeAtWorld(wx, wy) {
  for (var i = Nodes.length - 1; i >= 0; i--) {
    var n = Nodes[i];
    if (n.left !== undefined && n.visible !== false) {
      // Include expander area in hit box
      var extraRight = n.firstChildIndex ? (nExpanderSize + nExpanderDistance) : nExpanderHalfSize;
      if (wx >= n.left && wx <= n.right + extraRight &&
          wy >= n.top - 2 && wy <= n.bottom + 2)
        return i;
    }
  }
  return null;
}

function getTouchDistance(t1, t2) {
  var dx = t1.clientX - t2.clientX;
  var dy = t1.clientY - t2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function getTouchCenter(t1, t2) {
  return {
    x: (t1.clientX + t2.clientX) / 2,
    y: (t1.clientY + t2.clientY) / 2
  };
}

function updateZoomDisplay() {
  var el = document.getElementById('zoom-level');
  if (el) el.textContent = Math.round(camera.zoom * 100) + '%';
}

function MoveNodeToCenter(nodeIndex) {
  if (!Nodes[nodeIndex]) return;
  camera.x = Nodes[nodeIndex].left + Nodes[nodeIndex].width / 2;
  camera.y = Nodes[nodeIndex].verCenter;
}

function resetView() {
  if (!rootNodeIndex) return;
  SetAllNodesCollapsed(rootNodeIndex);
  Nodes[rootNodeIndex].expanded = true;
  SetNodesExpanded(rootNodeIndex, true, 2);
  CalcNodePositions();

  // Zoom 1.0, positioned so root is near left side of viewport
  camera.zoom = 1.0;
  var rn = Nodes[rootNodeIndex];
  var dpr = window.devicePixelRatio || 1;
  var viewW = canvas.width / dpr;
  // Place root ~20% from left edge
  camera.x = rn.left + viewW * 0.3;
  camera.y = rn.verCenter;
}
