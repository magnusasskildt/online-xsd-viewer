// ===== NODE LAYOUT & SIZING =====

function SetNodeSize(ctx, nodeIndex, recursive) {
  var typeWidth = 0;
  var annotationWidth = 0;

  if (!IsRealNode(Nodes[nodeIndex].type)) {
    Nodes[nodeIndex].height = nSequenceHeight;
    Nodes[nodeIndex].width = nSequenceWidth;
  } else {
    var height = nNodeHeight;
    ctx.font = sNodeNameFont;
    var width = ctx.measureText(Nodes[nodeIndex].name).width + nNodeTextPadding * 2;

    if (Nodes[nodeIndex].firstChildIndex)
      width += nExpanderHalfSize;

    if (Nodes[nodeIndex].attributes) {
      width += nExpanderSize;
      if (Nodes[nodeIndex].showAttributes) {
        var i, width2 = 0;
        for (i = 0; i < Nodes[nodeIndex].attributes.length; i++) {
          if (Nodes[nodeIndex].attributes[i].use == "required")
            ctx.font = sMandatoryAttributeNameFont;
          else
            ctx.font = sOptionalAttributeNameFont;
          width2 = Math.max(width2, ctx.measureText(Nodes[nodeIndex].attributes[i].name).width);
        }
        height += Nodes[nodeIndex].attributes.length * nAttributeLineHeight + nAttributeVerPadding * 2;
        width = Math.max(width, width2 + nNodeTextPadding * 2);
      }
    }

    Nodes[nodeIndex].height = Math.round(height);
    Nodes[nodeIndex].width = Math.round(width);
  }

  var sText = Nodes[nodeIndex].typeDescription;
  if (sText && sText.length > 0) {
    ctx.font = sTypeDescriptionFont;
    typeWidth = ctx.measureText(sText).width;
  }

  sText = Nodes[nodeIndex].annotation;
  if (sText && sText.length > 0) {
    ctx.font = sAnnotationFont;
    var totalTextWidth = ctx.measureText(sText).width;
    var annotationLines = [];
    var nChars = 0, nPartWidth = 0, nChars2 = 0, nPartWidth2 = 0;
    var sPart = "", sPart2 = "", chr = " ";

    while (totalTextWidth > nMaxAnnotationWidth) {
      nChars = Math.round((sText.length * nMaxAnnotationWidth) / totalTextWidth);
      sPart = sText.substr(0, nChars);
      nPartWidth = ctx.measureText(sPart).width;

      if (nPartWidth < nMaxAnnotationWidth) {
        nChars2 = nChars + 1;
        sPart2 = sText.substr(0, nChars2);
        nPartWidth2 = ctx.measureText(sPart2).width;
        while (nPartWidth2 <= nMaxAnnotationWidth) {
          nChars = nChars2;
          sPart = sPart2;
          nPartWidth = nPartWidth2;
          nChars2 = nChars + 1;
          sPart2 = sText.substr(0, nChars2);
          nPartWidth2 = ctx.measureText(sPart2).width;
        }
      }

      if (nPartWidth > nMaxAnnotationWidth) {
        nChars2 = nChars - 1;
        sPart2 = sText.substr(0, nChars2);
        nPartWidth2 = ctx.measureText(sPart2).width;
        while (nPartWidth2 > nMaxAnnotationWidth) {
          nChars = nChars2;
          sPart = sPart2;
          nPartWidth = nPartWidth2;
          nChars2 = nChars - 1;
          sPart2 = sText.substr(0, nChars2);
          nPartWidth2 = ctx.measureText(sPart2).width;
        }
      }

      nChars2 = nChars;
      chr = sText.substr(nChars, 1);
      while (nChars2 > 10 && sTextDelimeters.indexOf(chr) < 0) {
        nChars2--;
        chr = sText.substr(nChars2, 1);
      }

      if (sTextDelimeters.indexOf(chr) >= 0) {
        sPart = sText.substr(0, nChars2);
        annotationLines.push(sPart);
        sText = sText.substr(nChars2 + 1, 999);
      } else {
        nChars2 = nChars - 1;
        sPart = sText.substr(0, nChars2) + "-";
        annotationLines.push(sPart);
        sText = sText.substr(nChars2, 999);
      }

      totalTextWidth = ctx.measureText(sText).width;
    }

    annotationLines.push(sText);

    for (var i = 0; i < annotationLines.length; i++)
      annotationWidth = Math.max(annotationWidth, ctx.measureText(annotationLines[i]).width);

    Nodes[nodeIndex].annotationLines = annotationLines;
    Nodes[nodeIndex].footerHeight = Math.round((nAnnotationTextHeight + nAnnotationLineDistance) * annotationLines.length);
  } else {
    Nodes[nodeIndex].footerHeight = 0;
    Nodes[nodeIndex].footerWidth = 0;
  }

  Nodes[nodeIndex].footerWidth = Math.round(Math.max(typeWidth, annotationWidth));

  var totalHeight = Nodes[nodeIndex].height + Nodes[nodeIndex].footerHeight;

  if (IsMultiple(Nodes[nodeIndex].maxOccurs))
    totalHeight += nMultipleNodeOffset;

  if (Nodes[nodeIndex].typeDescription)
    totalHeight += nAnnotationTextHeight + nAnnotationLineDistance;

  if (totalHeight > 0)
    totalHeight += nAnnotationDistance - nAnnotationLineDistance;

  Nodes[nodeIndex].totalHeight = totalHeight;

  if (recursive) {
    var nextNodeIndex = Nodes[nodeIndex].firstChildIndex;
    while (nextNodeIndex) {
      SetNodeSize(ctx, nextNodeIndex, recursive);
      nextNodeIndex = Nodes[nextNodeIndex].nextIndex;
    }
  }
}

function CurrentTotalHeight(nodeIndex) {
  var bAddBaseDistance = false;
  var totalHeight = Nodes[nodeIndex].height;

  if (IsMultiple(Nodes[nodeIndex].maxOccurs))
    totalHeight += nMultipleNodeOffset;

  if (Nodes[nodeIndex].typeDescription && bShowTypeInfo) {
    totalHeight += nAnnotationTextHeight + nAnnotationLineDistance;
    bAddBaseDistance = true;
  }

  if (Nodes[nodeIndex].annotation && bShowAnnotations) {
    totalHeight += Nodes[nodeIndex].footerHeight;
    bAddBaseDistance = true;
  }

  if (bAddBaseDistance)
    totalHeight += nAnnotationDistance - nAnnotationLineDistance;

  return totalHeight;
}

function SetNodeSizes() {
  var canvas = document.getElementById("tree");
  var ctx = canvas.getContext("2d");
  ctx.font = sNodeNameFont;
  SetNodeSize(ctx, rootNodeIndex, true);
}

function GetTreeHeight(nodeIndex) {
  var nodeHeight = CurrentTotalHeight(nodeIndex);
  var childrenHeight = 0 - nVerNodeDistance;
  var result = nodeHeight;

  if (Nodes[nodeIndex].expanded) {
    var nextNodeIndex = Nodes[nodeIndex].firstChildIndex;
    while (nextNodeIndex) {
      childrenHeight += GetTreeHeight(nextNodeIndex) + nVerNodeDistance;
      nextNodeIndex = Nodes[nextNodeIndex].nextIndex;
    }
  }

  if (childrenHeight > 0) {
    Nodes[nodeIndex].childrenHeight = childrenHeight;
    result = childrenHeight;
  }

  return result;
}

function SetVerNodePosition(nodeIndex, y) {
  var verPosition = y;
  var nHalfHeight = Nodes[nodeIndex].height / 2;
  var firstChildIndex = Nodes[nodeIndex].firstChildIndex;

  if (firstChildIndex && Nodes[nodeIndex].expanded) {
    var nextNodeIndex = firstChildIndex;
    var previousNodeIndex;

    while (nextNodeIndex) {
      verPosition = SetVerNodePosition(nextNodeIndex, verPosition);
      previousNodeIndex = nextNodeIndex;
      nextNodeIndex = Nodes[nextNodeIndex].nextIndex;
    }

    Nodes[nodeIndex].verCenter = Math.round((Nodes[firstChildIndex].verCenter + Nodes[previousNodeIndex].verCenter) / 2);
    Nodes[nodeIndex].top = Nodes[nodeIndex].verCenter - nHalfHeight;
    Nodes[nodeIndex].bottom = Nodes[nodeIndex].top + Nodes[nodeIndex].height;

    verPosition = Math.max(verPosition, Nodes[nodeIndex].top + CurrentTotalHeight(nodeIndex) + nVerNodeDistance);
  } else {
    Nodes[nodeIndex].top = y;
    Nodes[nodeIndex].verCenter = y + nHalfHeight;
    Nodes[nodeIndex].bottom = y + Nodes[nodeIndex].height;
    verPosition += CurrentTotalHeight(nodeIndex) + nVerNodeDistance;
    nSchemaWidth = Math.max(nSchemaWidth, Nodes[nodeIndex].left + Nodes[nodeIndex].totalWidth);
  }

  return verPosition;
}

function SetVerNodePositions() {
  nSchemaHeight = 0;
  nSchemaWidth = 0;
  nSchemaHeight = SetVerNodePosition(rootNodeIndex, nSchemaBorder);
}

function ChildNodeCount(nodeIndex) {
  var result = 0;
  var nextNodeIndex = Nodes[nodeIndex].firstChildIndex;
  while (nextNodeIndex) {
    result++;
    nextNodeIndex = Nodes[nextNodeIndex].nextIndex;
  }
  return result;
}

function SetHorNodePosition(nodeIndex, x, recursive, visible) {
  var nodeType = Nodes[nodeIndex].type;
  var firstChildIndex = Nodes[nodeIndex].firstChildIndex;

  Nodes[nodeIndex].left = x;
  var width = Nodes[nodeIndex].width;
  var right = x + width;
  Nodes[nodeIndex].right = right;
  Nodes[nodeIndex].expHorCenter = -999;
  Nodes[nodeIndex].visible = visible;

  if (firstChildIndex) {
    if (nodeType == NodeTypeChoice || nodeType == NodeTypeSequence || nodeType == NodeTypeAll) {
      Nodes[nodeIndex].expHorCenter = right + nExpanderHalfSize;
      width += nExpanderSize;
    } else {
      Nodes[nodeIndex].expHorCenter = right;
      width += nExpanderHalfSize;
    }
  }

  Nodes[nodeIndex].totalWidth = Math.max(width + nMinHorLineLength, Nodes[nodeIndex].footerWidth - nSequenceWidth);

  if ((nodeType == NodeTypeChoice || nodeType == NodeTypeSequence || nodeType == NodeTypeAll) && ChildNodeCount(nodeIndex) > 1)
    Nodes[nodeIndex].totalWidth += nMinHorLineLength;

  var nextHorPos = x + Nodes[nodeIndex].totalWidth;

  var nextNodeIndex = firstChildIndex;
  var childrenVisible = visible && Nodes[nodeIndex].expanded;

  while (nextNodeIndex) {
    SetHorNodePosition(nextNodeIndex, nextHorPos, recursive, childrenVisible);
    nextNodeIndex = Nodes[nextNodeIndex].nextIndex;
  }
}

function CalcNodePositions() {
  nSchemaHeight = 0;
  nSchemaWidth = 0;
  GetTreeHeight(rootNodeIndex);
  SetVerNodePositions();
  SetHorNodePosition(rootNodeIndex, nSchemaBorder, true, true);
  // Recalculate nSchemaWidth from visible nodes only
  nSchemaWidth = 0;
  for (var i = 1; i < Nodes.length; i++) {
    if (Nodes[i].visible !== false && Nodes[i].left !== undefined && Nodes[i].totalWidth !== undefined) {
      nSchemaWidth = Math.max(nSchemaWidth, Nodes[i].left + Nodes[i].totalWidth);
    }
  }
}

function GetMaxChildWidth(nodeIndex) {
  var result = 0;
  var nextNodeIndex = Nodes[nodeIndex].firstChildIndex;
  while (nextNodeIndex) {
    result = Math.max(result, Nodes[nextNodeIndex].totalWidth);
    nextNodeIndex = Nodes[nextNodeIndex].nextIndex;
  }
  return result;
}

function ExpandChoiceNodes(nodeIndex) {
  var nextNodeIndex = Nodes[nodeIndex].firstChildIndex;
  while (nextNodeIndex) {
    if (Nodes[nextNodeIndex].type == NodeTypeChoice)
      Nodes[nextNodeIndex].expanded = true;
    nextNodeIndex = Nodes[nextNodeIndex].nextIndex;
  }
}
