// ===== GLOBAL STATE =====

var Nodes = [];
var ComplexTypes = [];
var SimpleTypes = [];
var SchemaKeys = [];
var SchemaKeyRefs = [];
var GlobalElements = [];
var SearchResults = [];

var rootNodeIndex = null;
var bResolveComplexTypes = false;
var bTooManySearchResults = false;

var xsdType = "xs";
var savedURLs = {};

var nLastClickedNodeIndex;
var nLastExpandedNodeIndex;
var nLastCollapsedNodeIndex;

var bShowAnnotations = true;
var bShowTypeInfo = true;

var lastSearchText = '';

var nCanvasHeight = 5000;
var nCanvasWidth = 5000;
var nSchemaBorder = 10;
var nSchemaHeight = 0;
var nSchemaWidth = 0;
