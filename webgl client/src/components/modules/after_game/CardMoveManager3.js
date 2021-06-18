import { Renderer } from "../main_webgl_modules/Renderer";
import Card from "../map_elements/Card";
import { BOARD_SIZE, FIELDS_COUNT, BOARD_POSITION, SMALLER_SIZE_X, FIELD } from "../settings/board_info";
import CameraColider from "../utils/CameraColider";


export default class CardMoveManager {
    /**
     * @param {import("../main_webgl_modules/Camera").default} this.camera
     * @param {Card[]} cards 
     * @param {import("../map_elements/Game_Board").default} game_board 
     * @param {Renderer} renderer
     */
    constructor(camera, meshees, cards, renderer, boardMap, turn, outlineCards) {
        this.camera = camera
        this.meshees = meshees;
        this.game_board = meshees[0];
        this.cards = cards;
        this.renderer = renderer;
        this.boardMap = boardMap;
        this.turn = turn;
        this.outlineCards = outlineCards;

        this.startCardX = null;
        this.startCardZ = null;
        this.lastNowX = null;
        this.lastNowZ = null;
        this.lastX = null;
        this.lastZ = null;
        this.newCard = null;
        this.first = { x: null, z: null, card: "", color: "", time: false, id: "" };
        this.cardsRow = [];
        this.lastSelectedOutLine = null;

        /**@type {Card} */
        this.selected_card = undefined;
        /**@type {import("three").Intersection} */
        this.board_intersect = undefined;


        // ------------------
        // camera Coliders
        // ------------------
        // this.cardsCameraColider = new CameraColider(this.camera, ...this.cards)
        this.cardsCameraColider = new CameraColider(this.camera, this.cards)
        // let card_arr = this.cards.map(el=>el.children.map())
        // let card_arr = [];

        // this.cards.forEach(el=>{
        //    card_arr.push(...el.children)
        // })

        // this.cardsCameraColider = new CameraColider(this.camera, ...card_arr)
        // console.log(this.game_board)
        this.gameBoardCameraColider = new CameraColider(this.camera, this.meshees)


        // ------------------
        // event listeners
        // ------------------
        this.mousedown_ev_bind = this.mousedown_ev.bind(this)
        this.mousemove_ev_bind = this.mousemove_ev.bind(this)
        this.mouseup_ev_bind = this.mouseup_ev.bind(this)


    }

    listenersAdd() {
        // this.boardMap.map.forEach(el => {
        //    el.forEach(element => {
        //       if (element.card != "") {
        //          element.card.position.x = element.xPos;
        //          element.card.position.z = element.zPos;
        //       }
        //    });
        // });
        window.addEventListener("mousedown", this.mousedown_ev_bind)
        window.addEventListener("mousemove", this.mousemove_ev_bind)
        window.addEventListener("mouseup", this.mouseup_ev_bind)
    }
    listenersRemove() {
        // this.boardMap.map.forEach(el => {
        //    el.forEach(element => {
        //       if (element.card != "") {
        //          element.card.position.x = element.xPos;
        //          element.card.position.z = element.zPos;
        //       }
        //    });
        // });
        window.removeEventListener("mousedown", this.mousedown_ev_bind)
        window.removeEventListener("mousemove", this.mousemove_ev_bind)
        window.removeEventListener("mouseup", this.mouseup_ev_bind)
    }

    /**
     * @description Funkcja wykonująca się na naciśnięcie myszy
     * @param {MouseEvent} e 
     */
    mousedown_ev(e) {
        // console.log(this.turn)
        if (this.selected_card != undefined) return
        e.preventDefault();
        // if (this.selected_card != undefined || e.target != this.renderer.domElement) return


        /**
         * szukanie karty do "złapania"
         */
        // console.log(this.cardsCameraColider.getIntersects(e));
        this.selected_card = this.cardsCameraColider.getIntersects(e)[0]?.object.parent.parent;
        this.selected_outlinecard = this.cardsCameraColider.getIntersects3(e, this.outlineCards)[0]?.object.parent.parent;
        // console.log(this.selected_outlinecard)

        if (this.selected_card != undefined) {
            this.startCardX = Math.floor((this.selected_outlinecard.position.x - FIELD.x + BOARD_SIZE.width / 2) / FIELD.width);
            this.startCardZ = Math.floor((this.selected_outlinecard.position.z - FIELD.z + BOARD_SIZE.depth / 2) / FIELD.depth);

            // this.startCardXpos = this.boardMap.map[this.startCardZ][this.startCardX].card.position.x;
            // this.startCardZpos = this.boardMap.map[this.startCardZ][this.startCardX].card.position.z;
        }
        // this.selected_card = this.cardsCameraColider.getIntersects(e)[0]?.object;
        // console.log(this.selected_card)

        /**
         * Zmiana cursora jeżeli złapę obiekt
         */
        if (this.selected_card != undefined) document.body.style.cursor = "grabbing"
    }




    /**
     * @description Funkcja wykonująca się na poruszenie się myszy    
     * @param {MouseEvent} e 
     */
    mousemove_ev(e) {
        if (this.selected_card == undefined) return
        /**
         * Pobieram dane pozycji 
         */
        let { x, z } = this.game_board.position

        /**
         * Obliczam wierzchołek lewy górny planszy
         */
        let startX = x - (BOARD_SIZE.width / 2);
        let startZ = z - ((BOARD_SIZE.depth) / 2);
        // let startX = x - (400 / 2);
        // let startZ = z - (400 / 2);

        /** 
         * Wyszukuję w którym punkcie kliknąłem tabelę
         */
        this.board_intersect = this.gameBoardCameraColider.getIntersects2(e)[0]
        // console.log(this.board_intersect)


        if (this.board_intersect == undefined) return;

        /**
         * Obliczam pozycje względnie do planszy, czyli, że punkt (0,0) to wierzchołek lewy górny planszy
         */
        let pointX = this.board_intersect.point.x - startX;
        let pointZ = this.board_intersect.point.z - startZ;

        /**
         * dane na temat pozycji itd. pierwszego prostokąta (0,0) (ten jeden prostokąt z wielu prostokątów na podzielonej planszy), 
         * gdzie ma środek, jaką ma szerokość i głębokość
         */
        let field = {
            x: (BOARD_SIZE.width / FIELDS_COUNT.x) / 2,  // względny środek prostokąta
            z: ((BOARD_SIZE.depth + SMALLER_SIZE_X.depth) / FIELDS_COUNT.z) / 2,  // względny środek prostokąta
            width: BOARD_SIZE.width / FIELDS_COUNT.x,
            depth: (BOARD_SIZE.depth + SMALLER_SIZE_X.depth) / FIELDS_COUNT.z,
        }

        /**
         * Obliczanie pozycji na zasadzie "snap to grid". 
         * Obliczam tj. procentowo pozycję na planszy. Mnożę przez ilość poszczególnych prostokątów w rzędzie/kolumnie. 
         * Potem robię Math.floor(), aby otrzymać zajętą komórkę.
         * Następnie to mnożę przez szerokość danego prostokąta 
         * Potem otrzymaną wartość dodaję do pozycji startowej (wierzchołek lewy/górny) 
         * i jeszcze dodaję pozycję środka danego prostokąta
         */
        let x_floor = Math.max(0, Math.floor((pointX / BOARD_SIZE.width) * FIELDS_COUNT.x - 0.01) * field.width);
        let y_floor = Math.max(0, Math.floor((pointZ / (BOARD_SIZE.depth + SMALLER_SIZE_X.depth)) * FIELDS_COUNT.z - 0.01) * field.depth);

        let nowX = Math.floor(x_floor / FIELD.width);
        let nowZ = Math.floor(y_floor / FIELD.depth);
        this.nnx = null;
        this.nnz = null;


        // if (this.startCardZ < 12) {

        //if (this.boardMap.map[nowZ][nowX].card != "" && (nowX != this.startCardX || nowZ != this.startCardZ) && this.lastX != this.boardMap.map[nowZ][nowX].card.position.x && this.lastZ != this.boardMap.map[nowZ][nowX].card.position.z) {
        // console.log(nowX, this.startCardX)
        if (this.boardMap.map[nowZ][nowX].card != "") {
            if (nowX != this.startCardX || nowZ != this.startCardZ) {
                console.log(this.lastX, this.boardMap.map[nowZ][nowX].card.position.x, this.lastZ, this.boardMap.map[nowZ][nowX].card.position.z)
                // if (this.lastX != this.boardMap.map[nowZ][nowX].card.position.x && this.lastZ != this.boardMap.map[nowZ][nowX].card.position.z) {
                //    console.log("oo")
                // }

            }

            // console.log(this.boardMap.map[nowZ][nowX].card)
        }

        if (this.boardMap.map[nowZ][nowX].card != "" && (nowX != this.startCardX || nowZ != this.startCardZ) && this.lastX != this.boardMap.map[nowZ][nowX].card.position.x && this.lastZ != this.boardMap.map[nowZ][nowX].card.position.z) {
            // if (this.boardMap.map[nowZ][nowX].card != "" && this.first.z != null && this.first.x != null && this.lastX != this.boardMap.map[nowZ][nowX].card.position.x && this.lastZ != this.boardMap.map[nowZ][nowX].card.position.z) {

            // if (this.lastNowX == null || this.lastNowZ == null) {
            console.log("eee")
            this.lastNowX = nowX;
            this.lastNowZ = nowZ;

            // }
            this.newCard = this.boardMap.map[nowZ][nowX].card;
            this.newOutCard = this.boardMap.map[nowZ][nowX].out;
            this.newId = this.boardMap.map[nowZ][nowX].ID;
            this.newColor = this.boardMap.map[nowZ][nowX].color;
            this.lastX = this.boardMap.map[nowZ][nowX].card.position.x;
            this.lastZ = this.boardMap.map[nowZ][nowX].card.position.z;

            // this.boardMap.map[nowZ][nowX].card.position.x = this.startCardXpos;
            // this.boardMap.map[nowZ][nowX].card.position.z = this.startCardZpos;
            this.boardMap.map[nowZ][nowX].card.position.x = this.lastPosX;
            this.boardMap.map[nowZ][nowX].card.position.z = this.lastPosZ;
            this.boardMap.map[nowZ][nowX].out.position.x = this.lastPosX;
            this.boardMap.map[nowZ][nowX].out.position.z = this.lastPosZ;
            // console.log(this.lastSelectedOutLine)
            this.boardMap.map[this.first.z][this.first.x].card = this.newCard;
            this.boardMap.map[this.first.z][this.first.x].color = this.newColor;
            this.boardMap.map[this.first.z][this.first.x].ID = this.newId;
            this.boardMap.map[this.first.z][this.first.x].out = this.newOutCard;

            this.boardMap.map[nowZ][nowX].card = ""
            this.boardMap.map[nowZ][nowX].out = ""
            this.boardMap.map[nowZ][nowX].ID = ""
            this.boardMap.map[nowZ][nowX].color = ""

            // this.lastSelectedOutLine.position.x = this.lastPosX;
            // this.lastSelectedOutLine.position.z = this.lastPosZ;



            // if (this.first.time == false) {
            //    this.first.x = Math.floor((this.lastPosX - FIELD.x + BOARD_SIZE.width / 2) / FIELD.width);
            //    this.first.z = Math.floor((this.lastPosZ - FIELD.z + BOARD_SIZE.depth / 2) / FIELD.depth);
            //    this.first.card = this.newCard;
            //    this.first.color = this.boardMap.map[nowZ][nowX].color;
            //    this.first.time = true;
            // }
        }
        // console.log(this.selected_outlinecard)

        this.lastPosX = this.selected_outlinecard.position.x;
        this.lastPosZ = this.selected_outlinecard.position.z;
        // this.lastSelectedOutLine = this.selected_outlinecard;
        this.first.x = Math.floor((this.lastPosX - FIELD.x + BOARD_SIZE.width / 2) / FIELD.width);
        this.first.z = Math.floor((this.lastPosZ - FIELD.z + BOARD_SIZE.depth / 2) / FIELD.depth);
        // this.first.color = this.boardMap.map[this.first.z][this.first.x].color;
        // this.first.ID = this.boardMap.map[this.first.z][this.first.x].ID;
        // this.first.out = this.boardMap.map[this.first.z][this.first.x].out;
        if (this.lastX != null && this.lastZ != null && (this.lastNowX != nowX || this.lastNowZ != nowZ)) {

            console.log("out")
            this.lastX = null;
            this.lastZ = null;
            // if (this.boardMap.map[nowZ][nowX].card != "" && this.boardMap.map[nowZ][nowX].card != this.boardMap.map[this.startCardZ][this.startCardX].card) {
            //    // this.cardsRow[this.cardsRow.length - 1].card.position.x = this.cardsRow[this.cardsRow.length - 1].x;
            //    // this.cardsRow[this.cardsRow.length - 1].card.position.y = this.cardsRow[this.cardsRow.length - 1].z;
            // } else {
            //    // this.newCard.position.x = this.set.xPos;
            //    // this.newCard.position.z = this.set.zPos;

            // //    this.boardMap.map.forEach(el => {
            // //       el.forEach(element => {
            // //          if (element.card != "") {
            // //             element.card.position.x = element.xPos;
            // //             element.card.position.z = element.zPos;
            // //          }
            // //       });
            // //    });
            // // }

        }

        //    // this.boardMap.map.forEach(el => {
        //    //    el.forEach(element => {
        //    //       if (element.card != "") {
        //    //          element.card.position.x = element.xPos;
        //    //          element.card.position.z = element.zPos;
        //    //       }
        //    //    });
        //    // });
        //    this.lastX = null;
        //    this.lastZ = null;
        //    this.lastNowX = null;
        //    this.lastNowZ = null;
        //    this.newCard = null;

        // }
        // }

        // console.log(startX, x_floor, field.x)
        this.selected_card.position.x = this.board_intersect.point.x
        this.selected_card.position.z = this.board_intersect.point.z
        // console.log(this.board_intersect.point.x)
        if (this.selected_outlinecard != undefined) {
            // console.log(startX, x_floor, field.x)
            this.selected_outlinecard.position.x = startX + x_floor + field.x
            this.selected_outlinecard.position.z = startZ + y_floor + field.z
        }
    }



    /**
     * @description Funkcja wykonująca się na podniesienie myszy    
     * @param {MouseEvent} e 
     */
    mouseup_ev(e) {
        if (this.selected_card == undefined) return
        this.selected_card.position.x = this.selected_outlinecard.position.x
        this.selected_card.position.z = this.selected_outlinecard.position.z
        /**
         * Na podniesienie klawisza odznaczam zaznaczony obiekt
         */

        // if (this.newCard != null) {
        //    // console.log(this.newCard, this.selected_card);
        //    // console.log(this.boardMap.map[this.startCardZ][this.startCardX].card)
        //    // this.boardMap.map[this.startCardZ][this.startCardX].card = this.newCard;
        //    this.boardMap.map[this.first.z][this.first.x].card = this.first.card;
        //    this.boardMap.map[this.first.z][this.first.x].color = this.first.color;
        //    this.boardMap.map[this.first.z][this.first.x].ID = this.first.id;
        //    this.first.time = false;
        // } else {
        //    // this.boardMap.map[this.startCardZ][this.startCardX].card = "";
        //    // this.boardMap.map[this.startCardZ][this.startCardX].color = "";
        // }
        let x = Math.floor((this.selected_card.position.x - FIELD.x + BOARD_SIZE.width / 2) / FIELD.width);
        let z = Math.floor((this.selected_card.position.z - FIELD.z + BOARD_SIZE.depth / 2) / FIELD.depth);
        console.log(this.boardMap.map[z][x])
        this.boardMap.map[z][x].card = this.selected_card;
        this.boardMap.map[z][x].color = this.boardMap.map[this.startCardZ][this.startCardX].color;
        this.boardMap.map[z][x].ID = this.boardMap.map[this.startCardZ][this.startCardX].ID;
        this.boardMap.map[z][x].out = this.selected_outlinecard;
        console.log(this.boardMap.map[z][x])
        // if (this.startCardZ != z && this.startCardX != x) {
        this.boardMap.map[this.startCardZ][this.startCardX].card = "";
        this.boardMap.map[this.startCardZ][this.startCardX].color = "";
        this.boardMap.map[this.startCardZ][this.startCardX].ID = "";
        this.boardMap.map[this.startCardZ][this.startCardX].out = "";
        // }





        this.selected_card = undefined
        console.log(this.boardMap.map)
        this.renderer.domElement.style.cursor = "grab"
    }
}