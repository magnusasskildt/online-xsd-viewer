// ===== XSD PARSER =====

function IsRealNode(nodeType) {
  return !(nodeType == NodeTypeChoice || nodeType == NodeTypeSequence || nodeType == NodeTypeAll);
}

function GetFirstChildNode(parentNode, nodeName) {
  var result;
  var childNodes = parentNode.childNodes;
  var i = 0;
  while (i < childNodes.length && !result) {
    if (childNodes[i].nodeName == nodeName)
      result = childNodes[i];
    else
      i++;
  }
  return result;
}


function StrLen(text) {
  var result = 0;
  if (typeof text == 'string')
    result = Number(text.length);
  return result;
}

function ToNumber(value, default_value) {
  var vt = typeof value;
  if (vt == 'number' || vt == 'string')
    return Number(value);
  return default_value;
}

function ToNumberUnbounded(value, default_value) {
  if (value == 'unbounded') return -1;
  var vt = typeof value;
  if (vt == 'number' || vt == 'string')
    return Number(value);
  return default_value;
}

function ToString(txt) {
  return (txt !== undefined) ? txt : '';
}

function ParseComplexTypeNode(node, parentIndex) {
  var childNodes = node.childNodes;
  var nodeName;
  var previousIndex = null;
  var nodeIndex = null;

  // Collect attributes directly on the complexType
  var directAttributes = [];
  for (var i = 0; i < childNodes.length; i++) {
    if (childNodes[i].nodeType == 1 && childNodes[i].nodeName == xsdType + ':attribute') {
      var attribute = {};
      attribute.name = childNodes[i].getAttribute("name");
      attribute.type = childNodes[i].getAttribute("type");
      attribute.use = childNodes[i].getAttribute("use");
      directAttributes.push(attribute);
    }
  }
  if (directAttributes.length > 0) {
    if (!Nodes[parentIndex].attributes) Nodes[parentIndex].attributes = [];
    Nodes[parentIndex].attributes = Nodes[parentIndex].attributes.concat(directAttributes);
    Nodes[parentIndex].showAttributes = true;
  }

  for (var i = 0; i < childNodes.length; i++) {
    if (childNodes[i].nodeType == 1) {
      nodeName = childNodes[i].nodeName;
      if (nodeName == xsdType + ':choice' || nodeName == xsdType + ':sequence' || nodeName == xsdType + ':all') {
        previousIndex = nodeIndex;
        nodeIndex = AddNode(childNodes[i], parentIndex, previousIndex);
        if (parentIndex != null && previousIndex == null)
          Nodes[parentIndex].firstChildIndex = nodeIndex;
        if (previousIndex != null)
          Nodes[previousIndex].nextIndex = nodeIndex;
      }
      if (nodeName == xsdType + ':complexContent') {
        var extensionNode = GetFirstChildNode(childNodes[i], xsdType + ':extension');
        if (extensionNode) {
          Nodes[parentIndex].baseTypeName = extensionNode.getAttribute("base");
          // Parse child sequences/choices/all inside the extension
          var extChildren = extensionNode.childNodes;
          for (var j = 0; j < extChildren.length; j++) {
            if (extChildren[j].nodeType == 1) {
              var extChildName = extChildren[j].nodeName;
              if (extChildName == xsdType + ':sequence' || extChildName == xsdType + ':choice' || extChildName == xsdType + ':all') {
                previousIndex = nodeIndex;
                nodeIndex = AddNode(extChildren[j], parentIndex, previousIndex);
                if (parentIndex != null && previousIndex == null)
                  Nodes[parentIndex].firstChildIndex = nodeIndex;
                if (previousIndex != null)
                  Nodes[previousIndex].nextIndex = nodeIndex;
              }
              if (extChildren[j].nodeName == xsdType + ':attribute') {
                if (!Nodes[parentIndex].attributes) Nodes[parentIndex].attributes = [];
                var extAttr = {};
                extAttr.name = extChildren[j].getAttribute("name");
                extAttr.type = extChildren[j].getAttribute("type");
                extAttr.use = extChildren[j].getAttribute("use");
                Nodes[parentIndex].attributes.push(extAttr);
                Nodes[parentIndex].showAttributes = true;
              }
            }
          }
        }
        var restrictionNode = GetFirstChildNode(childNodes[i], xsdType + ':restriction');
        if (restrictionNode) {
          Nodes[parentIndex].baseTypeName = restrictionNode.getAttribute("base");
          Nodes[parentIndex].isRestriction = true;
          // Parse child sequences/choices/all inside the restriction
          var restChildren = restrictionNode.childNodes;
          for (var j = 0; j < restChildren.length; j++) {
            if (restChildren[j].nodeType == 1) {
              var restChildName = restChildren[j].nodeName;
              if (restChildName == xsdType + ':sequence' || restChildName == xsdType + ':choice' || restChildName == xsdType + ':all') {
                previousIndex = nodeIndex;
                nodeIndex = AddNode(restChildren[j], parentIndex, previousIndex);
                if (parentIndex != null && previousIndex == null)
                  Nodes[parentIndex].firstChildIndex = nodeIndex;
                if (previousIndex != null)
                  Nodes[previousIndex].nextIndex = nodeIndex;
              }
              if (restChildren[j].nodeName == xsdType + ':attribute') {
                if (!Nodes[parentIndex].attributes) Nodes[parentIndex].attributes = [];
                var restAttr = {};
                restAttr.name = restChildren[j].getAttribute("name");
                restAttr.type = restChildren[j].getAttribute("type");
                restAttr.use = restChildren[j].getAttribute("use");
                Nodes[parentIndex].attributes.push(restAttr);
                Nodes[parentIndex].showAttributes = true;
              }
            }
          }
        }
      }
    }
  }
}

function ParseSequenceNode(node, parentIndex) {
  var childNodes = node.childNodes;
  var previousIndex = null;
  var nodeIndex = null;

  for (var i = 0; i < childNodes.length; i++) {
    if (childNodes[i].nodeType == 1) {
      previousIndex = nodeIndex;
      nodeIndex = AddNode(childNodes[i], parentIndex, previousIndex);
      if (parentIndex != null && previousIndex == null)
        Nodes[parentIndex].firstChildIndex = nodeIndex;
      if (previousIndex != null)
        Nodes[previousIndex].nextIndex = nodeIndex;
    }
  }
}

function ParseRestrictionFacets(restrictionNode, destIndex) {
  var childNodes = restrictionNode.childNodes;
  if (!Nodes[destIndex].enumeration) Nodes[destIndex].enumeration = [];

  for (var i = 0; i < childNodes.length; i++) {
    if (childNodes[i].nodeType == 1) {
      var internalNodeName = childNodes[i].nodeName;
      var val = childNodes[i].getAttribute("value");
      if (internalNodeName == xsdType + ':minLength')
        Nodes[destIndex].minLength = val;
      if (internalNodeName == xsdType + ':maxLength')
        Nodes[destIndex].maxLength = val;
      if (internalNodeName == xsdType + ':length') {
        Nodes[destIndex].minLength = val;
        Nodes[destIndex].maxLength = val;
      }
      if (internalNodeName == xsdType + ':pattern')
        Nodes[destIndex].pattern = val;
      if (internalNodeName == xsdType + ':enumeration')
        Nodes[destIndex].enumeration.push(val);
      if (internalNodeName == xsdType + ':totalDigits')
        Nodes[destIndex].totalDigits = val;
      if (internalNodeName == xsdType + ':fractionDigits')
        Nodes[destIndex].fractionDigits = val;
      if (internalNodeName == xsdType + ':minInclusive')
        Nodes[destIndex].minInclusive = val;
      if (internalNodeName == xsdType + ':maxInclusive')
        Nodes[destIndex].maxInclusive = val;
      if (internalNodeName == xsdType + ':minExclusive')
        Nodes[destIndex].minExclusive = val;
      if (internalNodeName == xsdType + ':maxExclusive')
        Nodes[destIndex].maxExclusive = val;
    }
  }
}

function ParseSimpleTypeNode(node, destIndex) {
  var restrictionNode = GetFirstChildNode(node, xsdType + ':restriction');

  if (restrictionNode) {
    Nodes[destIndex].baseTypeName = restrictionNode.getAttribute("base");
    Nodes[destIndex].enumeration = [];
    ParseRestrictionFacets(restrictionNode, destIndex);
  }
}

function ParseSimpleContentNode(node, destIndex) {
  var extensionNode = GetFirstChildNode(node, xsdType + ':extension');

  if (extensionNode) {
    Nodes[destIndex].baseTypeName = extensionNode.getAttribute("base");
    Nodes[destIndex].attributes = [];
    var childNodes = extensionNode.childNodes;

    for (var i = 0; i < childNodes.length; i++) {
      if (childNodes[i].nodeType == 1) {
        if (childNodes[i].nodeName == xsdType + ':attribute') {
          var attribute = {};
          attribute.name = childNodes[i].getAttribute("name");
          attribute.type = childNodes[i].getAttribute("type");
          attribute.use = childNodes[i].getAttribute("use");
          Nodes[destIndex].attributes.push(attribute);
        }
      }
    }
  }
}

function UpdateTypeDescription(nodeIndex) {
  var typeDescription;

  if (Nodes[nodeIndex].typeName)
    typeDescription = Nodes[nodeIndex].typeName;

  if (Nodes[nodeIndex].baseTypeName) {
    if (typeDescription)
      typeDescription += ":  " + Nodes[nodeIndex].baseTypeName;
    else
      typeDescription = Nodes[nodeIndex].baseTypeName;

    var minLength = Nodes[nodeIndex].minLength;
    var maxLength = Nodes[nodeIndex].maxLength;

    if (minLength)
      if (maxLength)
        if (minLength == maxLength)
          typeDescription += " (" + maxLength + " chars)";
        else
          typeDescription += " (" + minLength + "-" + maxLength + " chars)";
      else
        typeDescription += " (min " + minLength + " chars)";
    else
      if (maxLength)
        typeDescription += " (max " + maxLength + " chars)";

    // totalDigits / fractionDigits
    var totalDigits = Nodes[nodeIndex].totalDigits;
    var fractionDigits = Nodes[nodeIndex].fractionDigits;
    if (totalDigits) {
      if (fractionDigits)
        typeDescription += " (" + totalDigits + " digits, " + fractionDigits + " decimals)";
      else
        typeDescription += " (" + totalDigits + " digits)";
    }

    // minInclusive / maxInclusive / minExclusive / maxExclusive
    var rangeMin = Nodes[nodeIndex].minInclusive || Nodes[nodeIndex].minExclusive;
    var rangeMax = Nodes[nodeIndex].maxInclusive || Nodes[nodeIndex].maxExclusive;
    if (rangeMin || rangeMax) {
      var minBracket = Nodes[nodeIndex].minInclusive ? "[" : "(";
      var maxBracket = Nodes[nodeIndex].maxInclusive ? "]" : ")";
      var minVal = rangeMin || "";
      var maxVal = rangeMax || "";
      typeDescription += " " + minBracket + minVal + ".." + maxVal + maxBracket;
    }
  }

  if (typeDescription) {
    var minOccurs = Nodes[nodeIndex].minOccurs;
    var maxOccurs = Nodes[nodeIndex].maxOccurs;
    if (maxOccurs != "1")
      if (minOccurs == maxOccurs)
        typeDescription += "  [" + maxOccurs + "]";
      else
        if (maxOccurs > 0)
          typeDescription += "  [" + minOccurs + "..." + maxOccurs + "]";
        else
          typeDescription += "  [" + minOccurs + "...unbound]";
  }

  Nodes[nodeIndex].typeDescription = typeDescription;
}

function AddNode(node, parentIndex, previousIndex) {
  var mynode = {};
  var complexTypeNode;

  mynode.parentIndex = parentIndex;
  mynode.previousIndex = previousIndex;

  var internalNodeName = node.nodeName;

  if (internalNodeName == xsdType + ':choice')
    mynode.type = NodeTypeChoice;

  if (internalNodeName == xsdType + ':sequence')
    mynode.type = NodeTypeSequence;

  if (internalNodeName == xsdType + ':all')
    mynode.type = NodeTypeAll;

  if (internalNodeName == xsdType + ':element') {
    mynode.name = node.getAttribute("name");
    mynode.typeName = node.getAttribute("type");
    mynode.ref = node.getAttribute("ref");
    mynode.minOccurs = ToNumber(node.getAttribute("minOccurs"), 1);
    mynode.maxOccurs = ToNumberUnbounded(node.getAttribute("maxOccurs"), 1);
    if (mynode.typeName && mynode.typeName.length > 0 && mynode.typeName.substr(0, 3) != xsdType + ':')
      mynode.type = NodeTypeComplex;
  }

  mynode.firstChildIndex = null;
  mynode.expanded = false;
  mynode.showAttributes = true;

  var annotationNode = GetFirstChildNode(node, xsdType + ':annotation');
  if (annotationNode) {
    var docNode = GetFirstChildNode(annotationNode, xsdType + ':documentation');
    if (docNode) {
      mynode.annotation = docNode.textContent;
    }
  }

  var nodeIndex = Nodes.length;
  Nodes.push(mynode);

  if (!mynode.typeName) {
    var simpleTypeNode = GetFirstChildNode(node, xsdType + ':simpleType');
    if (simpleTypeNode)
      ParseSimpleTypeNode(simpleTypeNode, nodeIndex);
  }

  if (!mynode.typeName) {
    complexTypeNode = GetFirstChildNode(node, xsdType + ':complexType');
    if (complexTypeNode) {
      var simpleContentNode = GetFirstChildNode(complexTypeNode, xsdType + ':simpleContent');
      if (simpleContentNode)
        ParseSimpleContentNode(simpleContentNode, nodeIndex);
    }
  }

  UpdateTypeDescription(nodeIndex);

  if (Nodes.length < 100000) {
    if (mynode.type == NodeTypeChoice || mynode.type == NodeTypeSequence || mynode.type == NodeTypeAll)
      ParseSequenceNode(node, nodeIndex);
    else {
      if (!mynode.typeName && !mynode.ref) {
        complexTypeNode = GetFirstChildNode(node, xsdType + ':complexType');
        if (complexTypeNode) {
          Nodes[nodeIndex].type = NodeTypeComplex;
          ParseComplexTypeNode(complexTypeNode, nodeIndex);
        }
      }
    }

    if (bResolveComplexTypes && !Nodes[nodeIndex].firstChildIndex) {
      // Resolve element ref
      if (mynode.ref && mynode.ref.length > 0)
        ResolveElementRef(nodeIndex);
      if (mynode.type == NodeTypeComplex && mynode.typeName && mynode.typeName.length > 0)
        ResolveComplexType(nodeIndex);
      if (mynode.baseTypeName && mynode.baseTypeName.length > 0)
        ResolveSimpleBaseType(nodeIndex);
    }
  }

  return nodeIndex;
}

function XPath(nodeIndex) {
  var result = "";
  var nodeType = Nodes[nodeIndex].type;
  if (nodeType != NodeTypeChoice && nodeType != NodeTypeSequence && nodeType != NodeTypeAll)
    result = "/" + Nodes[nodeIndex].name;
  var parentIndex = Nodes[nodeIndex].parentIndex;
  if (parentIndex)
    result = XPath(parentIndex) + result;
  return result;
}

function TypeNameUsedAbove(nodeIndex, typeName) {
  var result = false;
  var parentIndex = Nodes[nodeIndex].parentIndex;
  while (parentIndex && !result) {
    if (Nodes[parentIndex].typeName == typeName)
      result = true;
    else
      parentIndex = Nodes[parentIndex].parentIndex;
  }
  return result;
}

function SetNodesExpanded(nNodeIndex, bExpanded, nLevels) {
  var firstChildIndex = Nodes[nNodeIndex].firstChildIndex;
  if (firstChildIndex) {
    Nodes[nNodeIndex].expanded = bExpanded;
    if (nLevels > 1) {
      var nextNodeIndex = firstChildIndex;
      var nNextLevels = nLevels - 1;
      while (nextNodeIndex) {
        SetNodesExpanded(nextNodeIndex, bExpanded, nNextLevels);
        nextNodeIndex = Nodes[nextNodeIndex].nextIndex;
      }
    }
  }
}

function CopyChildNodes(destNodeIndex, sourceNodeIndex) {
  var firstChildIndex = Nodes[sourceNodeIndex].firstChildIndex;

  if (firstChildIndex) {
    var sourceNode = Nodes[firstChildIndex];
    var newNode = {};
    newNode.parentIndex = destNodeIndex;
    newNode.name = sourceNode.name;
    newNode.type = sourceNode.type;
    newNode.typeName = sourceNode.typeName;
    newNode.baseTypeName = sourceNode.baseTypeName;
    newNode.minOccurs = sourceNode.minOccurs;
    newNode.maxOccurs = sourceNode.maxOccurs;
    newNode.minLength = sourceNode.minLength;
    newNode.maxLength = sourceNode.maxLength;
    newNode.annotation = sourceNode.annotation;
    newNode.enumeration = sourceNode.enumeration;
    newNode.attributes = sourceNode.attributes;
    newNode.typeDescription = sourceNode.typeDescription;
    newNode.totalDigits = sourceNode.totalDigits;
    newNode.fractionDigits = sourceNode.fractionDigits;
    newNode.minInclusive = sourceNode.minInclusive;
    newNode.maxInclusive = sourceNode.maxInclusive;
    newNode.minExclusive = sourceNode.minExclusive;
    newNode.maxExclusive = sourceNode.maxExclusive;
    newNode.pattern = sourceNode.pattern;
    newNode.isRestriction = sourceNode.isRestriction;
    if (newNode.attributes) newNode.showAttributes = true;

    var newNodeIndex = Nodes.length;
    Nodes.push(newNode);
    Nodes[destNodeIndex].firstChildIndex = newNodeIndex;

    CopyChildNodes(newNodeIndex, firstChildIndex);

    var nextSourceIndex = sourceNode.nextIndex;
    while (nextSourceIndex) {
      var previousIndex = newNodeIndex;
      sourceNode = Nodes[nextSourceIndex];
      newNode = {};
      newNode.parentIndex = destNodeIndex;
      newNode.name = sourceNode.name;
      newNode.type = sourceNode.type;
      newNode.typeName = sourceNode.typeName;
      newNode.baseTypeName = sourceNode.baseTypeName;
      newNode.minOccurs = sourceNode.minOccurs;
      newNode.maxOccurs = sourceNode.maxOccurs;
      newNode.minLength = sourceNode.minLength;
      newNode.maxLength = sourceNode.maxLength;
      newNode.annotation = sourceNode.annotation;
      newNode.enumeration = sourceNode.enumeration;
      newNode.attributes = sourceNode.attributes;
      newNode.typeDescription = sourceNode.typeDescription;
      newNode.totalDigits = sourceNode.totalDigits;
      newNode.fractionDigits = sourceNode.fractionDigits;
      newNode.minInclusive = sourceNode.minInclusive;
      newNode.maxInclusive = sourceNode.maxInclusive;
      newNode.minExclusive = sourceNode.minExclusive;
      newNode.maxExclusive = sourceNode.maxExclusive;
      newNode.pattern = sourceNode.pattern;
      newNode.isRestriction = sourceNode.isRestriction;
      if (newNode.attributes) newNode.showAttributes = true;

      newNodeIndex = Nodes.length;
      Nodes.push(newNode);
      Nodes[previousIndex].nextIndex = newNodeIndex;

      CopyChildNodes(newNodeIndex, nextSourceIndex);
      nextSourceIndex = sourceNode.nextIndex;
    }
  } else {
    if (bResolveComplexTypes) {
      if (Nodes[destNodeIndex].type == NodeTypeComplex)
        ResolveComplexType(destNodeIndex);
      var baseTypeName = Nodes[sourceNodeIndex].baseTypeName;
      if (baseTypeName && baseTypeName.length > 0)
        ResolveSimpleBaseType(destNodeIndex);
    }
  }
}

function ResolveComplexType(nodeIndex) {
  var typeName = Nodes[nodeIndex].typeName;
  var complexTypeIndex = null;
  var i = 1;

  if (typeName) {
    while (i < ComplexTypes.length && !complexTypeIndex) {
      if (ComplexTypes[i].name == typeName)
        complexTypeIndex = i;
      else
        i++;
    }
  }

  if (complexTypeIndex != null) {
    if (TypeNameUsedAbove(nodeIndex, typeName))
      Nodes[nodeIndex].recursiveType = true;
    else {
      var sourceNodeIndex = ComplexTypes[complexTypeIndex].nodeIndex;
      Nodes[nodeIndex].baseTypeName = Nodes[sourceNodeIndex].baseTypeName;
      if (Nodes[sourceNodeIndex].firstChildIndex)
        CopyChildNodes(nodeIndex, ComplexTypes[complexTypeIndex].nodeIndex);
      UpdateTypeDescription(nodeIndex);
    }
  }

  if (complexTypeIndex == null && typeName) {
    var simpleTypeIndex = null;
    i = 1;
    while (i < SimpleTypes.length && !simpleTypeIndex) {
      if (SimpleTypes[i].name == typeName)
        simpleTypeIndex = i;
      else
        i++;
    }
    if (simpleTypeIndex) {
      var sourceNodeIndex = SimpleTypes[simpleTypeIndex].nodeIndex;
      Nodes[nodeIndex].baseTypeName = Nodes[sourceNodeIndex].baseTypeName;
      Nodes[nodeIndex].minLength = Nodes[sourceNodeIndex].minLength;
      Nodes[nodeIndex].maxLength = Nodes[sourceNodeIndex].maxLength;
      Nodes[nodeIndex].pattern = Nodes[sourceNodeIndex].pattern;
      Nodes[nodeIndex].enumeration = Nodes[sourceNodeIndex].enumeration;
      Nodes[nodeIndex].totalDigits = Nodes[sourceNodeIndex].totalDigits;
      Nodes[nodeIndex].fractionDigits = Nodes[sourceNodeIndex].fractionDigits;
      Nodes[nodeIndex].minInclusive = Nodes[sourceNodeIndex].minInclusive;
      Nodes[nodeIndex].maxInclusive = Nodes[sourceNodeIndex].maxInclusive;
      Nodes[nodeIndex].minExclusive = Nodes[sourceNodeIndex].minExclusive;
      Nodes[nodeIndex].maxExclusive = Nodes[sourceNodeIndex].maxExclusive;
      UpdateTypeDescription(nodeIndex);
    }
  }
}

function ResolveSimpleBaseType(nodeIndex) {
  var baseTypeName = Nodes[nodeIndex].baseTypeName;
  var simpleTypeIndex = null;
  var i = 1;

  while (i < SimpleTypes.length && !simpleTypeIndex) {
    if (SimpleTypes[i].name == baseTypeName)
      simpleTypeIndex = i;
    else
      i++;
  }
  if (simpleTypeIndex) {
    var sourceNodeIndex = SimpleTypes[simpleTypeIndex].nodeIndex;
    if (!Nodes[nodeIndex].minLength)
      Nodes[nodeIndex].minLength = Nodes[sourceNodeIndex].minLength;
    if (!Nodes[nodeIndex].maxLength)
      Nodes[nodeIndex].maxLength = Nodes[sourceNodeIndex].maxLength;
    if (!Nodes[nodeIndex].pattern)
      Nodes[nodeIndex].pattern = Nodes[sourceNodeIndex].pattern;
    if (!Nodes[nodeIndex].enumeration || Nodes[nodeIndex].enumeration.length == 0)
      Nodes[nodeIndex].enumeration = Nodes[sourceNodeIndex].enumeration;
    if (!Nodes[nodeIndex].totalDigits)
      Nodes[nodeIndex].totalDigits = Nodes[sourceNodeIndex].totalDigits;
    if (!Nodes[nodeIndex].fractionDigits)
      Nodes[nodeIndex].fractionDigits = Nodes[sourceNodeIndex].fractionDigits;
    if (!Nodes[nodeIndex].minInclusive)
      Nodes[nodeIndex].minInclusive = Nodes[sourceNodeIndex].minInclusive;
    if (!Nodes[nodeIndex].maxInclusive)
      Nodes[nodeIndex].maxInclusive = Nodes[sourceNodeIndex].maxInclusive;
    if (!Nodes[nodeIndex].minExclusive)
      Nodes[nodeIndex].minExclusive = Nodes[sourceNodeIndex].minExclusive;
    if (!Nodes[nodeIndex].maxExclusive)
      Nodes[nodeIndex].maxExclusive = Nodes[sourceNodeIndex].maxExclusive;
    UpdateTypeDescription(nodeIndex);
  }
}

function LoadComplexTypes(node) {
  var childNodes = node.childNodes;
  for (var i = 0; i < childNodes.length; i++) {
    if (childNodes[i].nodeType == 1 && childNodes[i].nodeName == xsdType + ':complexType') {
      var complexType = {};
      complexType.name = childNodes[i].getAttribute("name");
      var mynode = {};
      mynode.name = complexType.name;
      mynode.type = NodeTypeComplex;
      var nodeCount = Nodes.length;
      Nodes.push(mynode);
      complexType.nodeIndex = nodeCount;
      ParseComplexTypeNode(childNodes[i], nodeCount);
      ComplexTypes.push(complexType);
    }
  }
}

function LoadSimpleTypes(node) {
  var childNodes = node.childNodes;
  for (var i = 0; i < childNodes.length; i++) {
    if (childNodes[i].nodeType == 1 && childNodes[i].nodeName == xsdType + ':simpleType') {
      var simpleType = {};
      simpleType.name = childNodes[i].getAttribute("name");
      var mynode = {};
      mynode.name = simpleType.name;
      mynode.type = NodeTypeSimple;
      var nodeCount = Nodes.length;
      Nodes.push(mynode);
      simpleType.nodeIndex = nodeCount;
      ParseSimpleTypeNode(childNodes[i], nodeCount);
      SimpleTypes.push(simpleType);
    }
  }
}

function LoadIncludes(sourcePath, node) {
  var childNodes = node.childNodes;
  var nIncludes = 0;

  for (var i = 0; i < childNodes.length; i++) {
    if (childNodes[i].nodeType == 1 && childNodes[i].nodeName == xsdType + ':include') {
      var schemaLocation = childNodes[i].getAttribute("schemaLocation");
      if (schemaLocation) {
        var schemaURL = sourcePath + schemaLocation;
        var xhttp = new XMLHttpRequest();
        xhttp.overrideMimeType('text/xml');
        xhttp.open("GET", schemaURL, false);
        xhttp.send(null);
        var xmlDoc = xhttp.responseXML;
        nIncludes++;

        var schemaNode = GetFirstChildNode(xmlDoc, xsdType + ':schema');
        LoadSimpleTypes(schemaNode);
        LoadComplexTypes(schemaNode);
      }
    }
  }
  return nIncludes;
}

function LoadGlobalElements(node) {
  var childNodes = node.childNodes;
  for (var i = 0; i < childNodes.length; i++) {
    if (childNodes[i].nodeType == 1 && childNodes[i].nodeName == xsdType + ':element') {
      var elemName = childNodes[i].getAttribute("name");
      if (elemName) {
        GlobalElements.push({ name: elemName, node: childNodes[i] });
      }
    }
  }
}

function ResolveElementRef(nodeIndex) {
  var refName = Nodes[nodeIndex].ref;
  if (!refName) return;

  // Find the global element
  var globalElem = null;
  for (var i = 0; i < GlobalElements.length; i++) {
    if (GlobalElements[i].name == refName) {
      globalElem = GlobalElements[i];
      break;
    }
  }

  if (globalElem) {
    var elemNode = globalElem.node;
    Nodes[nodeIndex].name = refName;
    Nodes[nodeIndex].typeName = elemNode.getAttribute("type");

    // Get annotation from the referenced element if we don't have one
    if (!Nodes[nodeIndex].annotation) {
      var annotationNode = GetFirstChildNode(elemNode, xsdType + ':annotation');
      if (annotationNode) {
        var docNode = GetFirstChildNode(annotationNode, xsdType + ':documentation');
        if (docNode) Nodes[nodeIndex].annotation = docNode.textContent;
      }
    }

    if (Nodes[nodeIndex].typeName && Nodes[nodeIndex].typeName.length > 0) {
      if (Nodes[nodeIndex].typeName.substr(0, xsdType.length + 1) != xsdType + ':')
        Nodes[nodeIndex].type = NodeTypeComplex;
      ResolveComplexType(nodeIndex);
    } else {
      // Inline type on the referenced element
      var complexTypeNode = GetFirstChildNode(elemNode, xsdType + ':complexType');
      if (complexTypeNode) {
        Nodes[nodeIndex].type = NodeTypeComplex;
        ParseComplexTypeNode(complexTypeNode, nodeIndex);
      }
      var simpleTypeNode = GetFirstChildNode(elemNode, xsdType + ':simpleType');
      if (simpleTypeNode) {
        ParseSimpleTypeNode(simpleTypeNode, nodeIndex);
      }
    }
    UpdateTypeDescription(nodeIndex);
  }
}

function LoadKeys(rootElement) {
  var childNodes = rootElement.childNodes;
  var keys = [];

  for (var i = 0; i < childNodes.length; i++) {
    if (childNodes[i].nodeType == 1) {
      var nodeName = childNodes[i].nodeName;
      if (nodeName == xsdType + ':key' || nodeName == xsdType + ':unique') {
        var key = {};
        key.name = childNodes[i].getAttribute("name");
        key.type = (nodeName == xsdType + ':unique') ? 'unique' : 'key';
        var selectorNode = GetFirstChildNode(childNodes[i], xsdType + ':selector');
        if (selectorNode) key.selector = selectorNode.getAttribute("xpath");
        var fieldNode = GetFirstChildNode(childNodes[i], xsdType + ':field');
        if (fieldNode) key.field = fieldNode.getAttribute("xpath");

        var annotationNode = GetFirstChildNode(childNodes[i], xsdType + ':annotation');
        if (annotationNode) {
          var docNode = GetFirstChildNode(annotationNode, xsdType + ':documentation');
          if (docNode) key.annotation = docNode.textContent;
        }
        keys.push(key);
      }
    }
  }
  return keys;
}

function LoadKeyRefs(rootElement) {
  var childNodes = rootElement.childNodes;
  var keyrefs = [];

  for (var i = 0; i < childNodes.length; i++) {
    if (childNodes[i].nodeType == 1 && childNodes[i].nodeName == xsdType + ':keyref') {
      var keyref = {};
      keyref.name = childNodes[i].getAttribute("name");
      keyref.refer = childNodes[i].getAttribute("refer");
      var selectorNode = GetFirstChildNode(childNodes[i], xsdType + ':selector');
      if (selectorNode) keyref.selector = selectorNode.getAttribute("xpath");
      var fieldNode = GetFirstChildNode(childNodes[i], xsdType + ':field');
      if (fieldNode) keyref.field = fieldNode.getAttribute("xpath");
      keyrefs.push(keyref);
    }
  }
  return keyrefs;
}
