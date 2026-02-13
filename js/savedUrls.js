// ===== DEFAULT SAVED URLS =====

function getDefaultSavedURLs() {
  var urls = {};

  // Næringsspesifikasjon og skattemelding
  urls["Næringsspesifikasjon v6"] = {
    "url": "https://raw.githubusercontent.com/Skatteetaten/skattemeldingen/refs/heads/master/src/resources/xsd/naeringsspesifikasjon_v6_ekstern.xsd",
    "type": "xsd", "customtype": ""
  };
  urls["Skattemelding Upersonlig v5"] = {
    "url": "https://raw.githubusercontent.com/Skatteetaten/skattemeldingen/refs/heads/master/src/resources/xsd/skattemeldingUpersonlig_v5_ekstern.xsd",
    "type": "xsd", "customtype": ""
  };
  urls["Skattemelding (personlig) v13"] = {
    "url": "https://raw.githubusercontent.com/Skatteetaten/skattemeldingen/refs/heads/master/src/resources/xsd/skattemelding_v13_ekstern.xsd",
    "type": "xsd", "customtype": ""
  };
  urls["Selskapsmelding med deltakerfastsetting v4"] = {
    "url": "https://raw.githubusercontent.com/Skatteetaten/skattemeldingen/refs/heads/master/src/resources/xsd/selskapsmeldingSelskapMedDeltakerfastsetting_v4_ekstern.xsd",
    "type": "xsd", "customtype": ""
  };

  // Kompakt
  /*
  urls["Næringsspesifikasjon v6 - kompakt"] = {
    "url": "https://raw.githubusercontent.com/Skatteetaten/skattemeldingen/refs/heads/master/src/resources/xsd/naeringsspesifikasjon_v6_kompakt_ekstern.xsd",
    "type": "xsd", "customtype": ""
  };
  urls["Skattemelding Upersonlig v5 - kompakt"] = {
    "url": "https://raw.githubusercontent.com/Skatteetaten/skattemeldingen/refs/heads/master/src/resources/xsd/skattemeldingUpersonlig_v5_kompakt_ekstern.xsd",
    "type": "xsd", "customtype": ""
  };
  urls["Skattemelding (personlig) v13 - kompakt"] = {
    "url": "https://raw.githubusercontent.com/Skatteetaten/skattemeldingen/refs/heads/master/src/resources/xsd/skattemelding_v13_kompakt_ekstern.xsd",
    "type": "xsd", "customtype": ""
  };
  urls["Selskapsmelding med deltakerfastsetting v4 - kompakt"] = {
    "url": "https://raw.githubusercontent.com/Skatteetaten/skattemeldingen/refs/heads/master/src/resources/xsd/selskapsmeldingSelskapMedDeltakerfastsetting_v4_kompakt_ekstern.xsd",
    "type": "xsd", "customtype": ""
  };
  */

  // SAF-T
  urls["SAF-T Financial Skatteetaten"] = {
    "url": "https://raw.githubusercontent.com/Skatteetaten/saf-t/master/Norwegian_SAF-T_Financial_Schema_v_1.10.xsd",
    "type": "xs", "customtype": ""
  };
  urls["SAF-T Cash Register Skatteetaten"] = {
    "url": "https://raw.githubusercontent.com/Skatteetaten/saf-t/master/Norwegian_SAF-T_Cash_Register_Schema_v_1.00.xsd",
    "type": "xsd", "customtype": ""
  };

  return urls;
}
