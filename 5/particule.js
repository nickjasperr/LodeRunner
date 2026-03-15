/*
 * © 2026 Nicholas (Jasper) Birla-Eliade
 * Tous droits réservés.
 *
 * Ce code et son contenu sont la propriété exclusive de Nicholas Birla-Eliade, aka Nick Jasper.
 * Aucune partie de ce code ne peut être reproduite, modifié, distribuée ou utilisée sans autorisation écrite préalable.
 */

class Particule{
    constructor(x, y, ticks){
        this.x = x;
        this.y = y;

        this.couleur = Math.floor((ticks + 8) / 16 % 4);
        if(this.couleur == 3){ this.couleur = 1; }

        this.texture = "particules/" + this.couleur.toString() + "0";

        this.anim = 0;
        this.fini = false;
    }

    Tick(){
        this.anim += 0.25;
        this.texture = "particules/" + this.couleur.toString() + Math.floor(this.anim).toString();
    }

    EstFini(){
        return this.anim > 4.6;
    }

    PosX(){
        return Math.floor(this.x / 16);
    }

    PosY(){
        return Math.floor(MAP_H - (this.y - 15) / 16);
    }
}