// ===== CANVAS RENDERER =====

function SetCanvasSize(w, h) {
  var dpr = window.devicePixelRatio || 1;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = w + "px";
  canvas.style.height = h + "px";
  canvas.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0);
}

function resizeCanvasToContainer() {
  var container = document.getElementById("canvas-container");
  var w = container.clientWidth;
  var h = container.clientHeight;
  if (w > 0 && h > 0) {
    SetCanvasSize(w, h);
  }
}

// --- Dark mode aware colors ---
function getColors() {
  var dark = document.body.classList.contains('dark-mode');
  return {
    line: dark ? '#585b70' : '#9ca3af',
    shadow: dark ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.10)',
    nodeBg: dark ? '#313244' : '#ffffff',
    nodeBgOptional: dark ? '#2a2a3c' : '#f8fafc',
    selectedBg: dark ? '#1e3a5f' : '#eff6ff',
    nodeName: dark ? '#cdd6f4' : '#1e293b',
    requiredBorder: dark ? '#89b4fa' : '#3b82f6',
    optionalBorder: dark ? '#585b70' : '#cbd5e1',
    selectedBorder: dark ? '#89b4fa' : '#3b82f6',
    annotation: dark ? '#7f849c' : '#64748b',
    attrName: dark ? '#89b4fa' : '#475569',
    expanderBg: dark ? '#313244' : '#ffffff',
    expanderBorder: dark ? '#585b70' : '#94a3b8',
    expanderIcon: dark ? '#a6adc8' : '#64748b',
    typeBadgeBg: dark ? '#45475a' : '#f1f5f9',
    typeBadgeColor: dark ? '#a6adc8' : '#64748b',
    points: dark ? '#585b70' : '#94a3b8',
    seqChoiceBg: dark ? '#45475a' : '#f1f5f9',
    seqChoiceBorder: dark ? '#585b70' : '#cbd5e1',
    seqChoiceDot: dark ? '#a6adc8' : '#64748b'
  };
}

function DrawLine(ctx, x1, y1, x2, y2) {
  var c = getColors();
  ctx.beginPath();
  ctx.lineWidth = nLineWidth;
  ctx.strokeStyle = c.line;
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function IsMultiple(maxOccurs) {
  return (maxOccurs > 1 || maxOccurs < 0);
}

// --- Modern expander: circle with + or − ---
function DrawExpander(ctx, px, py, bExpanded) {
  var c = getColors();
  var r = nExpanderRadius;

  // Circle
  ctx.beginPath();
  ctx.arc(px, py, r, 0, 2 * Math.PI);
  ctx.fillStyle = c.expanderBg;
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = c.expanderBorder;
  ctx.stroke();

  // + or −
  ctx.beginPath();
  ctx.strokeStyle = c.expanderIcon;
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  // Horizontal line (always)
  ctx.moveTo(px - 4, py);
  ctx.lineTo(px + 4, py);
  if (!bExpanded) {
    // Vertical line for +
    ctx.moveTo(px, py - 4);
    ctx.lineTo(px, py + 4);
  }
  ctx.stroke();
  ctx.lineCap = 'butt';
}

function DrawAttrExpander(ctx, px, py, bExpanded) {
  // Reuse same style but smaller
  var c = getColors();
  var r = nExpanderRadius * 0.7;

  ctx.beginPath();
  ctx.arc(px, py, r, 0, 2 * Math.PI);
  ctx.fillStyle = c.expanderBg;
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = c.expanderBorder;
  ctx.stroke();

  ctx.beginPath();
  ctx.strokeStyle = c.expanderIcon;
  ctx.lineWidth = 1;
  ctx.lineCap = 'round';
  if (bExpanded) {
    ctx.moveTo(px - 3, py);
    ctx.lineTo(px + 3, py);
  } else {
    ctx.moveTo(px - 3, py);
    ctx.lineTo(px + 3, py);
    ctx.moveTo(px, py - 3);
    ctx.lineTo(px, py + 3);
  }
  ctx.stroke();
  ctx.lineCap = 'butt';
}

function DrawAnnotation(ctx, nodeIndex) {
  var node = Nodes[nodeIndex];
  var c = getColors();
  var y = node.bottom + nAnnotationDistance;

  if (node.maxOccurs > 1 || node.maxOccurs < 0)
    y += nMultipleNodeOffset;

  if (node.typeDescription && bShowTypeInfo) {
    ctx.font = sTypeDescriptionFont;
    ctx.fillStyle = c.annotation;
    ctx.fillText(node.typeDescription, node.left, y + nAnnotationTextHeight);
    y += nAnnotationTextHeight + nAnnotationLineDistance;
  }

  if (node.annotation && bShowAnnotations && node.annotationLines) {
    for (var i = 0; i < node.annotationLines.length; i++) {
      ctx.font = sAnnotationFont;
      ctx.fillStyle = c.annotation;
      ctx.fillText(node.annotationLines[i], node.left, y + nAnnotationTextHeight);
      y += nAnnotationTextHeight + nAnnotationLineDistance;
    }
  }
}

// --- Rounded rectangle helper ---
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function DrawOctagonShape(ctx, left, top, width, height, corner) {
  var right = left + width;
  var bottom = top + height;
  ctx.moveTo(left + corner, top);
  ctx.lineTo(right - corner, top);
  ctx.lineTo(right, top + corner);
  ctx.lineTo(right, bottom - corner);
  ctx.lineTo(right - corner, bottom);
  ctx.lineTo(left + corner, bottom);
  ctx.lineTo(left, bottom - corner);
  ctx.lineTo(left, top + corner);
  ctx.lineTo(left + corner, top);
}

function DrawOctagonWithShadow(ctx, nodeIndex) {
  var node = Nodes[nodeIndex];
  var c = getColors();

  // Shadow
  ctx.beginPath();
  ctx.fillStyle = c.shadow;
  DrawOctagonShape(ctx, node.left + nShadowOffset, node.top + nShadowOffset, nSequenceWidth, nSequenceHeight, nSequenceCornerSize);
  ctx.fill();

  // Fill
  ctx.beginPath();
  ctx.fillStyle = (nodeIndex == nLastClickedNodeIndex) ? c.selectedBg : c.seqChoiceBg;
  DrawOctagonShape(ctx, node.left, node.top, nSequenceWidth, nSequenceHeight, nSequenceCornerSize);
  ctx.fill();

  // Border
  ctx.beginPath();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = (nodeIndex == nLastClickedNodeIndex) ? c.selectedBorder : c.seqChoiceBorder;
  DrawOctagonShape(ctx, node.left, node.top, nSequenceWidth, nSequenceHeight, nSequenceCornerSize);
  ctx.stroke();
}

function DrawPoints(ctx, nodeIndex) {
  var node = Nodes[nodeIndex];
  var c = getColors();
  var xx = node.right + nPointsDistance * 2;
  var yy = node.verCenter - nPointsHalfSize;
  ctx.fillStyle = c.points;
  for (var i = 3; i > 0; i--) {
    ctx.beginPath();
    ctx.arc(xx + nPointsSize / 2, yy + nPointsSize / 2, nPointsSize / 2, 0, 2 * Math.PI);
    ctx.fill();
    xx += nPointsSize + nPointsDistance;
  }
}

function DrawSequenceNode(ctx, nodeIndex) {
  var node = Nodes[nodeIndex];
  var c = getColors();
  var right = node.right;
  DrawOctagonWithShadow(ctx, nodeIndex);

  // Three dots inside
  var dx = nSequenceWidth / 7;
  var yy = node.verCenter;
  var d = dx * 0.35;
  var xx = node.left + dx * 2;

  ctx.fillStyle = c.seqChoiceDot;
  ctx.beginPath(); ctx.arc(xx, yy, d, 0, 2 * Math.PI); ctx.fill();
  xx += dx * 1.5;
  ctx.beginPath(); ctx.arc(xx, yy, d, 0, 2 * Math.PI); ctx.fill();
  xx += dx * 1.5;
  ctx.beginPath(); ctx.arc(xx, yy, d, 0, 2 * Math.PI); ctx.fill();

  DrawAnnotation(ctx, nodeIndex);
  if (node.firstChildIndex) {
    DrawExpander(ctx, node.expHorCenter, node.verCenter, node.expanded);
    right += nExpanderSize;
  }
  return right;
}

function DrawChoiceNode(ctx, nodeIndex) {
  var node = Nodes[nodeIndex];
  var c = getColors();
  var right = node.right;
  DrawOctagonWithShadow(ctx, nodeIndex);

  // Fork icon inside
  var dx = nSequenceWidth / 6;
  var dx2 = dx * 0.66;
  var xx = node.left + dx;
  var dy = Math.round(nSequenceHeight / 5) + 0.5;
  var yy = node.verCenter;
  var top2 = yy - dy;
  var bottom2 = yy + dy;

  ctx.beginPath();
  ctx.strokeStyle = c.seqChoiceDot;
  ctx.lineWidth = 1;
  ctx.moveTo(xx, yy); xx += dx; ctx.lineTo(xx, yy); xx += dx; ctx.lineTo(xx, top2 + 0.5);
  ctx.stroke();

  var d = dx * 0.33;
  xx += dx - 1;
  ctx.fillStyle = c.seqChoiceDot;
  ctx.beginPath(); ctx.arc(xx, top2 - 1, d, 0, 2 * Math.PI); ctx.fill();
  ctx.beginPath(); ctx.arc(xx + dx2 - 0.5, yy, d, 0, 2 * Math.PI); ctx.fill();
  ctx.beginPath(); ctx.arc(xx, bottom2 + 1, d, 0, 2 * Math.PI); ctx.fill();

  DrawAnnotation(ctx, nodeIndex);
  if (node.firstChildIndex) {
    DrawExpander(ctx, node.expHorCenter, node.verCenter, node.expanded);
    right += nExpanderSize;
  }
  return right;
}

function DrawAllNode(ctx, nodeIndex) {
  var node = Nodes[nodeIndex];
  var c = getColors();
  var right = node.right;
  DrawOctagonWithShadow(ctx, nodeIndex);

  // Draw "unordered" icon: two horizontal lines with shuffle arrows
  var cx = node.left + nSequenceWidth / 2;
  var yy = node.verCenter;
  var hw = nSequenceWidth * 0.22;
  var dy = nSequenceHeight * 0.15;

  ctx.strokeStyle = c.seqChoiceDot;
  ctx.lineWidth = 1.2;
  ctx.lineCap = 'round';

  // Top line
  ctx.beginPath();
  ctx.moveTo(cx - hw, yy - dy);
  ctx.lineTo(cx + hw, yy - dy);
  ctx.stroke();

  // Bottom line
  ctx.beginPath();
  ctx.moveTo(cx - hw, yy + dy);
  ctx.lineTo(cx + hw, yy + dy);
  ctx.stroke();

  // Small arrows indicating "any order"
  var arrowSize = 2.5;
  // Up arrow on left
  ctx.beginPath();
  ctx.moveTo(cx - hw + 1, yy);
  ctx.lineTo(cx - hw + 1, yy - dy + 1);
  ctx.moveTo(cx - hw + 1 - arrowSize, yy - dy + 1 + arrowSize);
  ctx.lineTo(cx - hw + 1, yy - dy + 1);
  ctx.lineTo(cx - hw + 1 + arrowSize, yy - dy + 1 + arrowSize);
  ctx.stroke();

  // Down arrow on right
  ctx.beginPath();
  ctx.moveTo(cx + hw - 1, yy);
  ctx.lineTo(cx + hw - 1, yy + dy - 1);
  ctx.moveTo(cx + hw - 1 - arrowSize, yy + dy - 1 - arrowSize);
  ctx.lineTo(cx + hw - 1, yy + dy - 1);
  ctx.lineTo(cx + hw - 1 + arrowSize, yy + dy - 1 - arrowSize);
  ctx.stroke();

  ctx.lineCap = 'butt';

  DrawAnnotation(ctx, nodeIndex);
  if (node.firstChildIndex) {
    DrawExpander(ctx, node.expHorCenter, node.verCenter, node.expanded);
    right += nExpanderSize;
  }
  return right;
}

function DrawElementNode(ctx, nodeIndex) {
  var node = Nodes[nodeIndex];
  var c = getColors();
  var right = node.right;
  var isRequired = node.minOccurs > 0;
  var isSelected = (nodeIndex == nLastClickedNodeIndex);
  var borderColor = isSelected ? c.selectedBorder : (isRequired ? c.requiredBorder : c.optionalBorder);
  var bgColor = isSelected ? c.selectedBg : (isRequired ? c.nodeBg : c.nodeBgOptional);
  var r = nNodeBorderRadius;

  var rectLeft = node.left;
  var rectTop = node.top;
  var rectWidth = node.width;
  var rectHeight = node.height;

  // Multiple occurrence: stacked card effect
  if (node.maxOccurs > 1 || node.maxOccurs < 0) {
    // Back card shadow
    roundRect(ctx, rectLeft + nMultipleNodeOffset + nShadowOffset, rectTop + nMultipleNodeOffset + nShadowOffset, rectWidth, rectHeight, r);
    ctx.fillStyle = c.shadow;
    ctx.fill();

    // Back card
    roundRect(ctx, rectLeft + nMultipleNodeOffset, rectTop + nMultipleNodeOffset, rectWidth, rectHeight, r);
    ctx.fillStyle = bgColor;
    ctx.fill();
    ctx.lineWidth = isRequired ? 1.5 : 1;
    ctx.strokeStyle = borderColor;
    if (!isRequired) ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  } else {
    // Shadow
    roundRect(ctx, rectLeft + nShadowOffset, rectTop + nShadowOffset, rectWidth, rectHeight, r);
    ctx.fillStyle = c.shadow;
    ctx.fill();
  }

  // Selection ring
  if (isSelected) {
    roundRect(ctx, rectLeft - 3, rectTop - 3, rectWidth + 6, rectHeight + 6, r + 2);
    ctx.strokeStyle = c.selectedBorder;
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.stroke();
  }

  // Main card
  roundRect(ctx, rectLeft, rectTop, rectWidth, rectHeight, r);
  ctx.fillStyle = bgColor;
  ctx.fill();
  ctx.lineWidth = isRequired ? 1.5 : 1;
  ctx.strokeStyle = borderColor;
  if (!isRequired) ctx.setLineDash([4, 4]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Left accent bar for required nodes
  if (isRequired && !isSelected) {
    ctx.beginPath();
    ctx.fillStyle = c.requiredBorder;
    var barW = 3;
    // Clip to rounded corner
    ctx.save();
    roundRect(ctx, rectLeft, rectTop, rectWidth, rectHeight, r);
    ctx.clip();
    ctx.fillRect(rectLeft, rectTop, barW, rectHeight);
    ctx.restore();
  }

  // Node name
  ctx.font = sNodeNameFont;
  ctx.fillStyle = c.nodeName;
  var textX = rectLeft + nNodeTextPadding + (isRequired ? 3 : 0);
  ctx.fillText(node.name, textX, rectTop + nNodeTextHeight + nNodeTextPadding);

  // Attributes
  if (Nodes[nodeIndex].attributes) {
    var i, yy = rectTop + nNodeTextHeight + nNodeTextPadding * 2;
    if (node.showAttributes) {
      // Divider line
      ctx.beginPath();
      ctx.strokeStyle = c.optionalBorder;
      ctx.lineWidth = 0.5;
      ctx.moveTo(rectLeft + 4, yy);
      ctx.lineTo(rectLeft + rectWidth - 4, yy);
      ctx.stroke();
      yy += nAttributeVerPadding;
      for (i = 0; i < Nodes[nodeIndex].attributes.length; i++) {
        ctx.font = (node.attributes[i].use == "required") ? sMandatoryAttributeNameFont : sOptionalAttributeNameFont;
        ctx.fillStyle = c.attrName;
        ctx.fillText(node.attributes[i].name, rectLeft + nNodeTextPadding, yy + nNodeTextHeight);
        yy += nAttributeLineHeight;
      }
    } else {
      DrawAttrExpander(ctx, rectLeft + rectWidth - nExpanderRadius - 2, yy, node.showAttributes);
    }
  }

  DrawAnnotation(ctx, nodeIndex);

  if (node.firstChildIndex) {
    DrawExpander(ctx, node.right + nExpanderDistance + nExpanderRadius, node.verCenter, node.expanded);
    right += nExpanderSize + nExpanderDistance;
  } else {
    if (node.recursiveType || node.typeName == xsdType + ':anyType' || node.baseTypeName == xsdType + ':anyType')
      DrawPoints(ctx, nodeIndex);
  }
  return right;
}

function DrawNode(ctx, nodeIndex, recursive) {
  var node = Nodes[nodeIndex];
  var nodeType = node.type;
  var right;

  if (nodeType == NodeTypeChoice)
    right = DrawChoiceNode(ctx, nodeIndex);
  else if (nodeType == NodeTypeSequence)
    right = DrawSequenceNode(ctx, nodeIndex);
  else if (nodeType == NodeTypeAll)
    right = DrawAllNode(ctx, nodeIndex);
  else
    right = DrawElementNode(ctx, nodeIndex);

  if (recursive && node.expanded) {
    var c = getColors();
    var childCount = ChildNodeCount(nodeIndex);
    var nextNodeIndex = node.firstChildIndex;
    var x = node.left + node.totalWidth;
    var y1 = node.verCenter;
    var y2 = node.verCenter;
    if (childCount > 1) x -= nMinHorLineLength;
    DrawLine(ctx, right, node.verCenter, x, node.verCenter);

    while (nextNodeIndex) {
      if (childCount > 1) {
        var y = Nodes[nextNodeIndex].verCenter;
        DrawLine(ctx, x, y, Nodes[nextNodeIndex].left, y);
        y1 = Math.min(y1, y);
        y2 = Math.max(y2, y);
      }
      DrawNode(ctx, nextNodeIndex, recursive);
      nextNodeIndex = Nodes[nextNodeIndex].nextIndex;
    }

    if (childCount > 1)
      DrawLine(ctx, x, y1, x, y2);
  }
}
