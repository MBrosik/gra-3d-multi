import {
   Scene,
   AxesHelper,
   BufferGeometry,
   DirectionalLight,
   Vector3
} from 'three';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

import { Renderer } from './modules/main_webgl_modules/Renderer';
import Camera from './modules/main_webgl_modules/Camera';
import { Keyboard } from './modules/main_webgl_modules/Keyboard_Manager';
import { my_WS, WS_Class } from './modules/WebSocket';
import LoadCards from './modules/utils/LoadCards';
import Game_Board from './modules/map_elements/Game_Board';
import Card from './modules/map_elements/Card';
import { BOARD_SIZE } from './modules/settings/board_info';
import CardMoveManager from './modules/after_game/CardMoveManager';
import AddIntoRooms from './modules/initial/AddIntoRooms';
import Interface from './modules/initial/Interface';



// import {STLLoader} from 'three/examples/jsm/loaders/STLLoader'

// const loader = new STLLoader();
// loader.load( './models/stl/ascii/slotted_disk.stl', function ( geometry ) {}


export default class Main {
   /**
    * @param {HTMLDivElement} container
    */
   constructor(container) {
      // -------------------
      // main WEBGL classes
      // -------------------
      this.container = container;
      this.scene = new Scene();
      this.renderer = new Renderer(this.scene, container);
      this.camera = new Camera(this.renderer);
      this.keyboard = new Keyboard();

      this.renderer.render_update(this.scene, this.camera);

      // -------------------
      // axis
      // -------------------
      [-1000, 1000].forEach(el => {
         var axes = new AxesHelper(el)
         this.scene.add(axes)
      });

      // -------------------
      // webSocket
      // -------------------

      // my_WS = new WS_Class();

      window.ws = my_WS;

      // --------------------
      // cards
      // --------------------
      /**@type {Card[]} */
      this.cards = []


      // --------------------
      // Card_move_manager
      // --------------------
      /**@type {CardMoveManager} */
      this.card_move_manager = undefined;

      //nick
      this.nick = "halo";



      this.initial();
      // this.init();
   }
   initial() {
      this.addIntoRooms = new AddIntoRooms(this.play.bind(this));
   }
   play(nick) {
      this.nick = nick;
      this.divToClose = document.getElementById("startDiv");
      this.divToClose.style.display = "none";
      this.allNicks = [{ nick: this.nick }, { nick: "user2" }, { nick: "user3" }, { nick: "user4" }]
      this.init();
   }
   async init() {
      console.log(this.nick)
      // ----------------------
      // Get Card resources
      // ----------------------

      /**@type {import("./modules/utils/LoadCards").cardObject} */
      this.cards_resources = await LoadCards();

      console.log(this.cards_resources)

      // ----------------------
      // Function timeline
      // ----------------------

      await this.createMap();
      await this.roomsAdd();
      this.whileGame();
   }
   async roomsAdd() {

      this.interface = new Interface();

      my_WS.mySend("joinRoom", { name: this.nick })

      // ---------------------------------
      // Nasłuch wiadomości od serwera
      // o dodaniu do pokoju
      // ---------------------------------

      let messageFunc = null;

      new Promise(res => {

         messageFunc = (ev) => {
            /**@type {{type:String, data:String}} */
            let parsedData = JSON.parse(ev.data);

            if (parsedData.type == "onAddedToRoom") {
               console.log(parsedData.data)
               res();
            }
         }

         my_WS.addEventListener("message", messageFunc)
      }).then(() => {
         my_WS.removeEventListener("message", messageFunc)
      })



      // ---------------------
      // check for game begin
      // ---------------------

      let messageFunc1 = null;

      await new Promise(res => {

         messageFunc1 = (ev) => {
            /**@type {{type:String, data:String}} */
            let parsedData = JSON.parse(ev.data);

            if (parsedData.type == "GameStarted") {
               console.log(parsedData.data)
               res();
            }
         }

         my_WS.addEventListener("message", messageFunc1)
      })

      this.interface.insertNicks(this.allNicks)

      my_WS.removeEventListener("message", messageFunc1)
   }

   whileGame() {

      this.card_move_manager = new CardMoveManager(this.camera, this.game_board, this.cards, this.renderer);
   }


   async createMap() {
      console.log("siemka")
      this.game_board = new Game_Board();
      this.scene.add(this.game_board)


      // ------------
      // light
      // ------------
      this.light = new DirectionalLight(0xffffee, 10);
      this.light.intensity = 0.7;
      this.light.position.set(0, 1200, -400);
      this.scene.add(this.light)


      // ----------------------
      // append Cards
      // ----------------------
      let card = new Card(
         this.cards_resources["Card1"].geometry,
         new Vector3(100, (BOARD_SIZE.height / 2), 100),
         this.game_board
      );
      this.cards.push(card);
      this.scene.add(card)

      {
         let card = new Card(
            this.cards_resources["Card1"].geometry,
            new Vector3(0, (BOARD_SIZE.height / 2), 0),
            this.game_board
         );
         this.cards.push(card);
         this.scene.add(card)
      }
   }
}