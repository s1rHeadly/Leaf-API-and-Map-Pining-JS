import { getElement, randomNumber, months } from "./utils.js";

(function () {
  "use strict";

  class App {
    constructor() {
      // DOM targets
      this.form = getElement("form");
      this.containerWorkouts = getElement(".workouts");
      this.inputType = getElement(".form__input--type");
      this.inputDistance = getElement(".form__input--distance");
      this.inputDuration = getElement(".form__input--duration");
      this.inputCadence = getElement(".form__input--cadence");
      this.inputElevation = getElement(".form__input--elevation");
      this.mapEl = getElement("#map");

      // globals
      this.currentLat = null;
      this.currentLong = null;
      this.map = null;
      this.lastClickedPosition = null;
      this.clickedLocations = [];
    }

    /* methods outside of the constructor */
  }
})();
