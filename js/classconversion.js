import { getElement, randomNumber, months, validNumber } from "./utils.js";

(function () {
  "use strict";

  /* 
  ==============================
  Workout Class
  =============================
  This is the Parent Class for the Workout Types
  Look at the the frontend using the App class and see what we need from that class in the Workout Class

  We have Running and Cycling => Two Child classes from the Workout class (Do later)
  - but each of the child classes has 
    - map coordinates
    - distance
    - duration

    WE ALSO NEED TO ADD
     - A DATE 
     - ID FOR EACH INSTANTIATION MADE
  */

  class Workout {
    // in the latest JS we do not need to set these vars as this.date = date => we can leave them here
    // also note these can be private fields ie #date, or #id
    date = new Date();
    id = +Date.now().toString().slice(-6); // last 6 nums of the Date.now()
    constructor(coords, distance, duration) {
      this.coords = coords; // [lat, long]
      this.distance = distance; // in km
      this.duration = duration; // in minutes
    }
  }

  /* 
  ==============================
  Child Classes from Workout Class (Running and Cycling)
  =============================
 */

  class Running extends Workout {
    constructor(coords, distance, duration, cadence) {
      super(coords, distance, duration);
      this.cadence = cadence; // this is an extra property
      // call the calcPace immediately
      this.calcPace();
    } // close contstructor

    calcPace() {
      // this.pace is a new property we add to the calcpace function, then call it inside the constructor so we its run immediately
      // remember: any function or listener called inside the constructor is evoked when a new instantiation of a class is created!
      this.pace = this.duration / (this.distance / 60);
    }
  }

  class Cycling extends Workout {
    constructor(coords, distance, duration, elevationGain) {
      super(coords, distance, duration); // this is an extra property
      this.elevationGain = elevationGain;
      this.calcSpeed();
    } // close contstructor

    calcSpeed() {
      // kmph
      this.speed = this.distance / this.duration;
    }
  }

  // testing (look at the values we need!!!)
  const running1 = new Running([45, -12], 5.7, 4.8, 455);
  const cycling1 = new Cycling([35, -34], 8, 23, 120);

  console.log({ running1, cycling1 });

  /*
  
  ===================
  Main App Arcitecture
  ==================
  */
  class App {
    /*Whatever is in the constructor will run when a new Class in instantiated
    - This includes the this_init() function
    */
    #locations = []; // we can add vars here instead of using 'this.clickedLocations = [];

    constructor() {
      //1. Get DOM targets
      this.form = getElement("form");
      this.containerWorkouts = getElement(".workouts");
      this.inputType = getElement(".form__input--type");
      this.inputDistance = getElement(".form__input--distance");
      this.inputDuration = getElement(".form__input--duration");
      this.inputCadence = getElement(".form__input--cadence");
      this.inputElevation = getElement(".form__input--elevation");
      this.mapEl = getElement("#map");

      //2. Create Globals
      this.currentLat = null;
      this.currentLong = null;
      this.map = null;
      this.lastClickedPosition = null;
      this.isWorkoutValid = false;
      //3. Start the App
      this._init(); // start the app
    }

    /* Methods outside of the constructor */

    async _init() {
      // holds _getCurrentLocation and _initialiseMap functions
      try {
        const { lat, long } = await this._getCurrentLocation();
        this.currentLat = lat;
        this.currentLong = long;

        this._initialiseMap({
          currentLat: this.currentLat,
          currentLong: this.currentLong,
        });

        // console.log("Current position:", this.currentLat, this.currentLong);
      } catch (error) {
        console.log("Location error:", error);
      }

      this._eventHandlers(); // we'll fill this next
    } // close _init function

    async _getCurrentLocation() {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject("Geolocation is not supported by this browser.");
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude;
            const long = position.coords.longitude;
            resolve({ lat, long }); // return pure values
          },
          (error) => {
            reject(error.message);
          }
        );
      });
    } // close _getCurrentLocation function

    _initialiseMap(options) {
      const { currentLat, currentLong } = options;
      const currentLocation = [currentLat, currentLong];

      // set the leafletmap
      this.map = L.map(this.mapEl, {
        closePopupOnClick: false,
        markerZoomAnimation: true,
      }).setView(currentLocation, 13);

      // set the initial leaflet tileLayer which is 'Open Street Map'
      L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(this.map);
    } // close _initialiseMap function

    _addMarkers(options) {
      const position = options.position;
      const text = options.text;
      const borderColor = options.border;
      // add the leaflet marker chain
      L.marker(position, {
        riseOnHover: true,
        keyboard: true,
      })
        .addTo(this.map)
        .bindPopup(
          L.popup({
            autoClose: false,
            closeOnClick: false,
            maxWidth: 250,
            minWidth: 100,
            className: `${borderColor}-popup`,
          }).setContent(`<p>${text}</p>`)
        )
        .openPopup();
    } // close _addMarkers function

    _onHandleMapClick(e) {
      if (this.form.classList.contains("hidden")) {
        this.form.classList.remove("hidden");
        // Force update based on the current select value
        this._updateSelect({ target: this.inputType });
      }

      /* immediately focus on the inputDistance form field */
      this.inputDistance.focus();

      /* get our values from the event */
      const { latlng } = e;
      const clickedLat = latlng?.lat;
      const clickedLong = latlng?.lng;

      /* update this.lastClickedPosition with the lat and long from the map */
      this.lastClickedPosition = [clickedLat, clickedLong];
    } // close _onHandleMapClick function

    _updateSelect(e) {
      const { target } = e;
      const value = target.value;

      const cadenceRow = this.inputCadence.closest(".form__row");
      const elevationRow = this.inputElevation.closest(".form__row");

      // Remove the hidden class from both rows first
      cadenceRow.classList.remove("form__row--hidden");
      elevationRow.classList.remove("form__row--hidden");

      // create the map
      const selected = {
        cycling: elevationRow,
        running: cadenceRow,
      };

      // guard clause
      if (selected[value]) {
        selected[value].classList.add("form__row--hidden");
      }
    } // close  _updateSelect function

    _eventHandlers() {
      // guard clause
      if (this.map) {
        this.map.on("click", this._onHandleMapClick.bind(this)); // bind here
      }
      this.form.addEventListener("submit", this._submitNewWorkout.bind(this)); // bind here
      this.inputType.addEventListener("change", this._updateSelect.bind(this)); // bind here
    } // close _eventHandlers

    _resetForm() {
      // Clear inputs after validation and processing
      this.inputDistance.value = "";
      this.inputDuration.value = "";
      this.inputCadence.value = "";
      this.inputElevation.value = "";

      // hide the form when the form is submitted
      this.form.classList.add("hidden");
    }

    _validateWorkoutData() {
      this.isWorkoutValid = false;

      const distance = +this.inputDistance.value;
      const duration = +this.inputDuration.value;
      const cadence = +this.inputCadence.value;
      const elevation = +this.inputElevation.value;
      const type = this.inputType.value;

      // Validate distance and duration always
      if (!validNumber(distance, duration)) {
        alert("Please enter positive numbers for distance and duration.");
        return false;
      }

      // Validate elevation if running (cadence is hidden)
      if (type === "running" && !validNumber(elevation)) {
        alert("Please enter a positive number for elevation.");
        return false;
      }

      // Validate cadence if cycling (elevation is hidden)
      if (type === "cycling" && !validNumber(cadence)) {
        alert("Please enter a positive number for cadence.");
        return false;
      }

      if (!this.lastClickedPosition) {
        alert("Please click on the map to select a location.");
        return false;
      }

      return true;
    }

    _submitNewWorkout(e) {
      e.preventDefault();

      let currentWorkout;

      // stop execution is the validation returns false
      if (!this._validateWorkoutData()) return;

      const isValid = this._validateWorkoutData();

      if (isValid) {
        this.isWorkoutValid = true;

        // get the type of workout value (running or cycling)
        const type = this.inputType.value;
        const distance = +this.inputDistance.value;
        const duration = +this.inputDuration.value;
        const cadence = +this.inputCadence.value; // Add + to convert to number
        const elevationGain = +this.inputElevation.value;

        // console.log(" _submitNewWorkout", { type, distance, duration,cadance, elevationGain }); // get the type

        if (type === "running") {
          // create new Running Class (update currentWorkout Var)
          currentWorkout = new Running(
            this.lastClickedPosition,
            distance,
            duration,
            elevationGain
          );
        }

        if (type === "cycling") {
          // create new Running Class (update currentWorkout Var)
          currentWorkout = new Cycling(
            this.lastClickedPosition,
            distance,
            duration,
            cadence
          );
        }

        // push to locations array
        this.#locations.push(currentWorkout);

        // Add marker with a message showing workout type and distance
        this._addMarkers({
          position: this.lastClickedPosition,
          text: `Workout: ${type}, Distance: ${distance} km`,
          border: type,
        });
      }

      this._resetForm();
    } // close _onFormSubmission function
  }

  /* 
  ==============================
  Start App
  =============================
 */

  /* Only expose for testing in dev as IFFE function is not scoped to the window object */
  const initialLoad = new App();
  window.app = initialLoad; // go into the console and type 'app'

  /*  otherwise ... Not Testing, but creating an App instance */
  // const myApp = new App();
})();
