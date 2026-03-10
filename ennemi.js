

class Ennemi{
    constructor(x, y, map, piege){
        this.map = map;
        this.x = x;
        this.y = y;

        this.pause = false;
        this.anim = 0;
        this.texture = "marche/1";
        this.flippe = 1;
        this.action = "";

        this.estPiege = false;
        this.tiensOr = false;

        this.piegeX;
        this.piegeY;
        this.piegeCooldown;

        this.piege = piege;
    }



    Tick(joueurX, joueurY, map, ennemis){
        let dejaGrimpe = false;

        let x = 0;

        if(joueurX > this.x){
            x = 1;
        }
        else if(joueurX < this.x){
            x = -1;
        }
        if(joueurY > this.y){
            this.haut = true;
            this.bas = false;
        }
        else if(joueurY < this.y){
            this.haut = false;
            this.bas = true;
        }

        // Tester or
        if(map.EstOr(this.x + 8, this.y + 8) && !this.tiensOr){
            map.DetruitTile(this.x + 8, this.y + 8);
            this.tiensOr = true;
        }
        
        if(this.pause){
            this.anim++;
            // Animation de revivement
            if(this.estMort){
                let numTemp = Math.floor((this.anim - 1) / 8);
                if(numTemp > 3){
                    this.piege();
                    this.pause = false;
                }
                else{
                    this.texture = "revient/" + numTemp.toString();
                }
            }
            else{
                // Animation d'attende du debut de jeu
            }
        }
        else{
            // MONTER ECHELLE
            if(this.haut){
                let xDesire = this.x;
                if(map.EstEchelle(this.x + 9, this.y)){
                    this.y += 1;
                    xDesire = Math.floor((this.x + 9) / 16) * 16;
                    dejaGrimpe = true;
                    this.Animer("grimpe", 4, 4);
                }
                else if(map.EstEchelle(this.x + 6, this.y)){
                    this.y += 1;
                    xDesire = Math.floor((this.x + 6) / 16) * 16;
                    dejaGrimpe = true;
                    this.Animer("grimpe", 4, 4);
                }
                if(this.x < xDesire){ this.x += 1; }
                else if(this.x > xDesire){ this.x -= 1; }
            }
            // DESCENDRE ECHELLE
            else if(this.bas){
                let xDesire = this.x;
                if(map.EstEchelle(this.x + 9, this.y - 2)){
                    this.y -= 1;
                    xDesire = Math.floor((this.x + 9) / 16) * 16;
                    dejaGrimpe = true;
                    this.Animer("grimpe", 4, 4);
                }
                else if(map.EstEchelle(this.x + 6, this.y - 2)){
                    this.y -= 1;
                    xDesire = Math.floor((this.x + 6) / 16) * 16;
                    dejaGrimpe = true;
                    this.Animer("grimpe", 4, 4);
                }
                if(this.x < xDesire){ this.x += 1; }
                else if(this.x > xDesire){ this.x -= 1; }
            }

            // Tester suffocation
            if( !dejaGrimpe && this.piegeCooldown < 0 &&
                (map.EstFermeInnocupe(this.x + 3, this.y + 3) || 
                map.EstFermeInnocupe(this.x + 12, this.y + 3) || 
                map.EstFermeInnocupe(this.x + 3, this.y + 12) || 
                map.EstFermeInnocupe(this.x + 12, this.y + 12)
                ))
            {
                this.Mourrir();
            }

            // Snap au grid si pas entrain de tomber
            if(this.action != "tombe"){
                this.x = Math.floor(this.x);
            }

            // Sorti du PIEGE;
            if(this.estPiege && this.anim > 119){
                this.estPiege = false;
                this.piegeX = -1;
                this.piegeY = -1;
                this.piegeCooldown = 14;
            }
            this.piegeCooldown--;

            // PIEGE
            if(map.EstBrique(this.x + 8, this.y + 8) || this.estPiege){
                if(!this.estPiege){
                    this.estPiege = true;
                    this.piegeX = Math.floor((this.x + 8)/ 16) * 16;
                    this.piegeY = Math.floor((this.y + 8)/ 16) * 16;
                    this.anim = 0;
                }
                this.anim++;
                this.texture = "tombe/0";
                // Piege X
                if(this.piegeX > this.x){
                    this.x += 2;
                    if(this.piegeX < this.x){ this.x -= 1; }
                }
                else if(this.piegeX < this.x){
                    this.x -= 2;
                    if(this.piegeX > this.x){ this.x += 1; }
                }
                // Piege Y
                if(this.anim > 103){
                    this.y = this.piegeY + this.anim - 103;
                    this.texture = "grimpe/" + Math.floor((this.anim / 2) % 4).toString();
                }
                else if(this.piegeY > this.y){
                    this.y += 1;
                }
                else if(this.piegeY < this.y){
                    this.y -= 3;
                    this.texture = "tombe/" + Math.floor((this.anim / 4) % 2);
                    while(this.piegeY > this.y){ this.y += 0.5; }
                }
            }
            // SUR LE SOL
            else if(map.EstMarchable(ennemis, this.x + 4, this.y - 2) || map.EstMarchable(ennemis, this.x + 11, this.y - 2) || this.piegeCooldown > -1){
                this.TickAtteri(x, dejaGrimpe, ennemis);
            }
            // SUR LA BARRE
            else if(this.EstSurBarre()){
                if(this.action != "barre"){
                    this.action = "barre";
                    this.anim = 0;
                    this.texture = "barre/0";
                }
                this.x += x;
                if(x != 0){
                    this.Animer("barre", 4, 3);
                    this.flippe = -x;
                }
                if(this.bas){
                    this.y -= 2;
                    this.Animer("tombe", 2, 1);
                }
            }
            // TOMBER
            else if(map.EstVide(ennemis, this.x, this.y - 1) || map.EstVide(ennemis, this.x + 15, this.y - 1) && !this.EstDansBrique()){
                this.y -= 1.5;
                this.Animer("tombe", 2, 2);

                let xDesire = Math.floor((this.x + 8)/ 16) * 16;
                if(xDesire > this.x){ this.x += 1; }
                else if(xDesire < this.x){ this.x -= 1; }

                while(!map.EstVide(ennemis, this.x + 7.5, this.y)){
                    this.y += 0.5;
                }
            }
        }
    }

    TickAtteri(x, dejaGrimpe, ennemis){
        // DEPLACEMENT SOL DROITE
        if(x < 0 && !dejaGrimpe){
            if((!map.EstFerme(ennemis, this.x - 1, this.y) && !map.EstFerme(ennemis, this.x - 1, this.y + 14)) || this.piegeCooldown > -1){
                this.x -= 1;
                this.Animer("marche", 4, 4);
                this.flippe = 1;
            }
            else if(map.EstVide(ennemis, this.x -1, this.y + 8)){
                if(map.EstVide(ennemis, this.x -1, this.y + 24)){
                    this.y += 1;
                }
                else if(map.EstVide(ennemis, this.x -1, this.y - 8)){
                    this.y -= 1;
                }
            }
        }
        // DEPLACEMENT SOL GAUCHE
        else if(x > 0 && !dejaGrimpe){
            if((!map.EstFerme(ennemis, this.x + 16, this.y) && !map.EstFerme(ennemis, this.x + 16, this.y + 14)) || this.piegeCooldown > -1){
                this.x += 1;
                this.Animer("marche", 4, 4);
                this.flippe = -1;
            }
            else if(map.EstVide(ennemis, this.x + 16, this.y + 8)){
                if(map.EstVide(ennemis, this.x + 16, this.y + 24)){
                    this.y += 1;
                }
                else if(map.EstVide(ennemis, this.x + 16, this.y - 8)){
                    this.y -= 1;
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

    EstDansBrique(){
        if(this.y % 16 == 0){
            return map.EstBriqueNonFerme(this.x + 6, this.y) || map.EstBriqueNonFerme(this.x + 9, this.y);
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
            this.texture = "revient/0";
            this.estMort = true;
            this.pause = true;
            this.estPiege = false;
            this.anim = 0;
            this.y = 3 * 16;
            this.x = Math.floor(Math.random() * (MAP_L - 1)) * 16;
        }
    }

    GetPosXDessin(taille){
        return this.x * taille;
    }

    GetPosYDessin(taille){
        return MAP_H * 16 * taille - this.y * taille;
    }
}