

class Joueur{
    constructor(meurt, collecteOr, gagner, detruire){
        this.x = MAP_L * 8 - 8;
        this.y = 3 * 16
        this.pause = false;
        this.estMort = false;
        this.anim = 0;
        this.texture = "marche/1";
        this.flippe = 1;
        this.action = "";

        this.meurt = meurt;
        this.collecteOr = collecteOr;
        this.gagner = gagner;
        this.detruire = detruire;
    }

    Tick(x, haut, bas, tireDroite, tireGauche, map, ennemis){
        let dejaGrimpe = false;

        // Tester toucher
        for(let e in ennemis){
            let en = ennemis[e];
            if(Math.abs(en.x - this.x) < 8 && Math.abs(en.y - this.y) < 8 && !en.estPiege){
                this.Mourrir();
            }
        }

        // Tester or
        if(map.EstOr(this.x + 8, this.y + 8)){
            map.DetruitTile(this.x + 8, this.y + 8);
            this.collecteOr();
        }

        // Tester gagner
        if(this.y > MAP_H * 16){
            this.gagner();
            
        }
        
        if(this.pause){
            this.anim++;
            // Animation de mort
            if(this.estMort){
                let numTemp = Math.floor((this.anim - 1) / 8);
                if(numTemp > 7){
                    this.meurt();
                }
                else{
                    this.texture = "mort/" + numTemp.toString();
                }
            }
            // Animation de detruire
            else{
                this.texture = "tire/" + Math.floor((this.anim - 1) / 8).toString();
                if(this.anim > 21){
                    this.pause = false;
                }
            }
        }
        else{
            // MONTER ECHELLE
            if(haut){
                let xDesire = this.x;
                if(map.EstEchelle(this.x + 9, this.y)){
                    this.y += 2;
                    xDesire = Math.floor((this.x + 9) / 16) * 16;
                    dejaGrimpe = true;
                    this.Animer("grimpe", 4, 4);
                }
                else if(map.EstEchelle(this.x + 6, this.y)){
                    this.y += 2;
                    xDesire = Math.floor((this.x + 6) / 16) * 16;
                    dejaGrimpe = true;
                    this.Animer("grimpe", 4, 4);
                }
                if(this.x < xDesire){ this.x += 2; }
                else if(this.x > xDesire){ this.x -= 2; }
            }
            // DESCENDRE ECHELLE
            else if(bas){
                let xDesire = this.x;
                if(map.EstEchelle(this.x + 9, this.y - 2)){
                    this.y -= 2;
                    xDesire = Math.floor((this.x + 9) / 16) * 16;
                    dejaGrimpe = true;
                    this.Animer("grimpe", 4, 4);
                }
                else if(map.EstEchelle(this.x + 6, this.y - 2)){
                    this.y -= 2;
                    xDesire = Math.floor((this.x + 6) / 16) * 16;
                    dejaGrimpe = true;
                    this.Animer("grimpe", 4, 4);
                }
                if(this.x < xDesire){ this.x += 2; }
                else if(this.x > xDesire){ this.x -= 2; }
            }

            // Tester suffocation
            if( !dejaGrimpe &&
                (map.EstFermeInnocupe(this.x + 3, this.y + 3) || 
                map.EstFermeInnocupe(this.x + 12, this.y + 3) || 
                map.EstFermeInnocupe(this.x + 3, this.y + 12) || 
                map.EstFermeInnocupe(this.x + 12, this.y + 12)
                ))
            {
                this.Mourrir();
            }

            // Snap au grid si pas sur la barre
            if(this.action != "barre"){
                this.x = Math.floor(this.x / 2) * 2;
            }
            
            // SUR LE SOL
            if(map.EstMarchable(ennemis, this.x + 4, this.y - 2) || map.EstMarchable(ennemis, this.x + 11, this.y - 2)){
                this.TickAtteri(x, dejaGrimpe, tireDroite, tireGauche, ennemis);
            }
            // SUR LA BARRE
            else if(this.EstSurBarre()){
                if(this.action != "barre"){
                    this.action = "barre";
                    this.anim = 0;
                    this.texture = "barre/0";
                }
                this.x += x * 1.5;
                if(x != 0){
                    this.Animer("barre", 4, 3);
                    this.flippe = -x;
                }
                if(bas){
                    this.y -= 4;
                    this.Animer("tombe", 4, 2);
                }
            }
            // TOMBER
            else if(map.EstVide(ennemis, this.x, this.y - 2) || map.EstVide(ennemis, this.x + 15, this.y - 2)){
                this.y -= 2;
                this.Animer("tombe", 4, 1);

                let xDesire = Math.floor((this.x + 8)/ 16) * 16;
                if(xDesire > this.x){ this.x += 1; }
                else if(xDesire < this.x){ this.x -= 1; }
            }
        }
        
    }

    TickAtteri(x, dejaGrimpe, tireDroite, tireGauche, ennemis){
        // DETRUIRE LE SOL
        if(map.EstMarchable(ennemis, this.x + 7.5, this.y - 2)){
            //Tire Droit
            if(tireDroite && map.EstTirable(ennemis, this.x + 24, this.y - 2)){
                map.DetruitTile(this.x + 24, this.y - 2);
                this.detruire(this.x + 24, this.y - 2);
                this.pause = true;
                this.anim = 0;
                this.flippe = -1;
                return;
            }
            // Tire Gauche
            else if(tireGauche && map.EstTirable(ennemis, this.x - 8, this.y - 2)){
                map.DetruitTile(this.x - 8, this.y - 2);
                this.detruire(this.x - 8, this.y - 2);
                this.pause = true;
                this.anim = 0;
                this.flippe = 1;
                return;
            }
        }
        // DEPLACEMENT SOL DROITE
        if(x < 0 && !dejaGrimpe){
            if(!map.EstFerme(ennemis, this.x - 2, this.y) && !map.EstFerme(ennemis, this.x - 2, this.y + 14)){
                this.x -= 2;
                this.Animer("marche", 4, 3);
                this.flippe = 1;
            }
            else if(map.EstVide(ennemis, this.x -2, this.y + 8)){
                if(map.EstVide(ennemis, this.x -2, this.y + 24)){
                    this.y += 2;
                }
                else if(map.EstVide(ennemis, this.x -2, this.y - 8)){
                    this.y -= 2;
                }
            }
        }
        // DEPLACEMENT SOL GAUCHE
        else if(x > 0 && !dejaGrimpe){
            if(!map.EstFerme(ennemis, this.x + 17, this.y) && !map.EstFerme(ennemis, this.x + 17, this.y + 14)){
                this.x += 2;
                this.Animer("marche", 4, 3);
                this.flippe = -1;
            }
            else if(map.EstVide(ennemis, this.x + 17, this.y + 8)){
                if(map.EstVide(ennemis, this.x + 17, this.y + 24)){
                    this.y += 2;
                }
                else if(map.EstVide(ennemis, this.x + 17, this.y - 8)){
                    this.y -= 2;
                }
            }
        }
    }

    EstSurBarre(){
        if(this.y % 16 == 0){
            return map.EstBarre(this.x + 6, this.y) || map.EstBarre(this.x + 9, this.y);
        }
        return false;
    }

    Animer(action, groupe, vitesse){
        if(this.action != action){
            this.action = action;
            this.anim = 0;
        }
        this.anim++;
        this.texture = action + "/" + Math.floor((this.anim / vitesse) % groupe).toString();
    }

    Mourrir(){
        if(!this.estMort){
            this.estMort = true;
            this.pause = true;
            this.anim = 0;
        }
    }

    GetPosXDessin(taille){
        return this.x * taille;
    }

    GetPosYDessin(taille){
        return MAP_H * 16 * taille - this.y * taille;
    }
}