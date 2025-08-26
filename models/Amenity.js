// models/Amenity.js
import mongoose from "mongoose";

const amenitySchema = new mongoose.Schema({
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true },

  bedroomLiving: {
    kingBed: { type: Boolean, default: false },
    livingArea: { type: Boolean, default: false },
    workDesk: { type: Boolean, default: false },
    walkInCloset: { type: Boolean, default: false },
    blackoutCurtains: { type: Boolean, default: false },
    airConditioning: { type: Boolean, default: false },
    privateBalcony: { type: Boolean, default: false },
    fireplace: { type: Boolean, default: false },
    soundproofRoom: { type: Boolean, default: false },
  },

  entertainment: {
    smartTV: { type: Boolean, default: false },
    cable: { type: Boolean, default: false },
    bluetooth: { type: Boolean, default: false },
    wifi: { type: Boolean, default: false },
    homeTheater: { type: Boolean, default: false },
    streamingServices: { type: Boolean, default: false },
    gamingConsole: { type: Boolean, default: false },
  },

  bathroom: {
    marbleBathroom: { type: Boolean, default: false },
    soakingTub: { type: Boolean, default: false },
    rainShower: { type: Boolean, default: false },
    doubleVanity: { type: Boolean, default: false },
    toiletries: { type: Boolean, default: false },
    heatedFloors: { type: Boolean, default: false },
    jacuzzi: { type: Boolean, default: false },
    sauna: { type: Boolean, default: false },
    steamRoom: { type: Boolean, default: false },
    bidet: { type: Boolean, default: false },
  },

  services: {
    roomService: { type: Boolean, default: false },
    housekeeping: { type: Boolean, default: false },
    concierge: { type: Boolean, default: false },
    miniBar: { type: Boolean, default: false },
    coffeeMaker: { type: Boolean, default: false },
    safeDeposit: { type: Boolean, default: false },
    privateChef: { type: Boolean, default: false },
    spaService: { type: Boolean, default: false },
    airportPickup: { type: Boolean, default: false },
    valetParking: { type: Boolean, default: false },
  },

  wellness: {
    privatePool: { type: Boolean, default: false },
    garden: { type: Boolean, default: false },
    yogaSpace: { type: Boolean, default: false },
    bbqArea: { type: Boolean, default: false },
  },

  smartFeatures: {
    smartControl: { type: Boolean, default: false },
    voiceAssistant: { type: Boolean, default: false },
    wirelessCharging: { type: Boolean, default: false },
    keylessEntry: { type: Boolean, default: false },
  },

  business: {
    conferenceRoom: { type: Boolean, default: false },
    printerScanner: { type: Boolean, default: false },
    wiredInternet: { type: Boolean, default: false },
    monitorWorkspace: { type: Boolean, default: false },
  }
}, { timestamps: true });

export default mongoose.model("Amenity", amenitySchema);
