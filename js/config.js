// ===== CONFIG & CONSTANTS =====

var NodeTypeComplex = 1;
var NodeTypeSimple = 2;
var NodeTypeSequence = 3;
var NodeTypeChoice = 4;
var NodeTypeString = 5;
var NodeTypeNumber = 6;
var NodeTypeInteger = 7;
var NodeTypeDate = 8;
var NodeTypeDateTime = 9;
var NodeTypeBoolean = 10;
var NodeTypeAll = 11;

var NodeTypeNames = ["", "Complex", "Simple", "Sequence", "Choice", "String", "Number", "Integer", "Date", "DateTime", "Boolean", "All"];

var nMaxSearchResults = 100;

// Canvas drawing constants
var sLineColor = "#9ca3af";
var nLineWidth = 1;
var nMultipleNodeOffset = 4;
var nShadowOffset = 3;
var sShadowColor = "rgba(0,0,0,0.10)";

// Node styling — modernized
var sNodeNameFont = "600 11pt 'Inter', 'Segoe UI', system-ui, sans-serif";
var sNodeNameColor = "#1e293b";
var sNodeBackgroundColor = "#ffffff";
var sSelectedNodeBackgroundColor = "#eff6ff";
var sOptionalNodeBackgroundColor = "#f8fafc";
var sRequiredNodeBorderColor = "#3b82f6";
var sOptionalNodeBorderColor = "#cbd5e1";
var sMandatoryAttributeNameFont = "bold 11px 'Inter', system-ui, sans-serif";
var sOptionalAttributeNameFont = "11px 'Inter', system-ui, sans-serif";
var sAttributeNameColor = "#475569";
var nAttributeVerPadding = 4;
var nAttributeLineHeight = 15;
var sTypeDescriptionFont = "500 10px 'Inter', system-ui, sans-serif";
var sAnnotationFont = "11px 'Inter', system-ui, sans-serif";
var sAnnotationColor = "#64748b";
var nAnnotationTextHeight = 11;
var nAnnotationLineDistance = 3;
var nMaxAnnotationWidth = 260;
var nAnnotationDistance = 8;

var nNodeTextHeight = 12;
var nNodeTextPadding = 10;
var nNodeHeight = nNodeTextHeight + nNodeTextPadding * 2;
var nHalfNodeHeight = nNodeHeight / 2;
var nNodeBorderRadius = 6;
var nSequenceWidth = nNodeHeight * 1.5;
var nSequenceHeight = Math.round(nNodeHeight * 0.833);
var nSequenceCornerSize = Math.round(nSequenceHeight * 0.26);

var sPointsColor = "#94a3b8";
var nPointsDistance = 5;
var nPointsSize = 3;
var nPointsHalfSize = 1.5;

var sSequenceBoxColor = "#64748b";

// Expander — circle with +/−
var nExpanderRadius = 8;
var nExpanderHalfSize = nExpanderRadius;
var nExpanderSize = nExpanderRadius * 2;
var nExpanderDistance = 4;
var sExpanderBgColor = "#ffffff";
var sExpanderBorderColor = "#94a3b8";
var sExpanderIconColor = "#64748b";

var nMinHorLineLength = 24;
var nVerNodeDistance = 14;

// Type badge
var sTypeBadgeFont = "500 9px 'Inter', system-ui, sans-serif";
var sTypeBadgeColor = "#64748b";
var sTypeBadgeBg = "#f1f5f9";
var nTypeBadgeHeight = 16;
var nTypeBadgePadding = 6;

var sTextDelimeters = " .,;:-+*/=<>()&%$\u00A3\"!#'[]{}\u00A5`~^\u00A7";
