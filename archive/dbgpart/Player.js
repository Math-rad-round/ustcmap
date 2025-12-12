import { shuffleArray } from '../../utilities.js';  
export class Player {
    constructor(props) {
        super(props);
        this.cardManager = cardManager;
        this.user = null;
        this.data = null;
        this.armor = 12;
        this.angry = 0;
        this.load = 0;
        this.def = 0;
        this.atk = 0;
        this.maxangry = 4;
        this.mov = 0;
        this.hp = 3;
        this.deck = [];
        this.discard = [];
        this.hand = [];
        this.played = [];
        this.actions = 0;
        this.bag = [];
        this.shop = [];
        this.disshop = [];
        this.enemy = [];
    }
    getState() {
        return {
            user: this.user,
            data: this.data,
            armor: this.armor,
            angry: this.angry,
            load: this.load,
            def: this.def,
            atk: this.atk,
            mov: this.mov,
            hp: this.hp,
            deck: [...this.deck],
            discard: [...this.discard],
            hand: [...this.hand],
            played: [...this.played],
            actions: this.actions,
            bag: [...this.bag],
            shop: [...this.shop],
            disshop: [...this.disshop],
            enemy: [...this.enemy]
        };
    }
    getInfo(cardId) {
        return this.cardManager.getCard(cardId);
    }
    findid(name) {
        return this.cardManager.findIdByName(name);
    }
    // 从牌库抽牌
    draw(count = 1) {
        const drawnCards = [];
        for (let i = 0; i < count; i++) {
            if (this.deck.length === 0) {
                this.shuffleDiscardIntoDeck();
                if (this.deck.length === 0) break;
            }
            const cardId = this.deck.pop();
            const cardInfo = this.getCardInfo(cardId);
            drawnCards.push(cardInfo);
            this.hand.push(cardId);
        }
        return drawnCards;
    }
    play(pos){
        if(pos<this.hand.length){
            const card = getinfo(this.hand[pos]);
            if(card.canplay(Gamepad,this)){
                this.hand.splice(cardIndex, 1);
                if(card.autoupgrade){
                    const upgradeId = this.getupgradecard(card);
                    this.played.push(upgradeId);
                }else if(!card.oneuse){
                    this.played.push(cardId);
                }
                card.play(Gamepad, this);
            }
        }
    }
    endturn(){
        for(let i=0;i<this.played.length;i++){
            const cardId = this.played[i];
            const card = this.getInfo(cardId);
            card.endturn(Gamepad, this);
        }
        this.discard.push(...this.played);
        this.played = [];
        for(let i=0;i<this.hand.length;i++){
            const cardId = this.hand[i];
            const card = this.getInfo(cardId);
            if(card.keep){
                this.played.push(cardId);
            }else if(!card.void){
                this.discard.push(cardId);
            }
        }
        this.hand=this.played;this.played = [];
        this.draw(5);
    }
    shuffleDiscardIntoDeck() {
        this.deck = [...this.discard];
        this.discard = [];
        shuffleArray(this.deck);
    }
    adddef(value) {this.def += value;}
    addatk(value) {this.atk += value;}
    addmov(value) {this.mov += value;}
    adddown(value) {this.load += value;}
    getdown(value) {return this.load >= value;}
    addup(value) {this.data += value;}
    addangry(value) {this.angry += value;if(this.angry>maxangry){
        adddef(-this.angry/this.maxangry);
        this.angry%=this.maxangry;
    }}
    addcard(id){
        this.discard.push(id);
    }
    addshock(id){
        this.discard.push(this.findid("shock"))
    }
    getupgradecard(card){
       return (this.findid(card.name+"_p"));
    }
}
