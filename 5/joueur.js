/*
 * © 2026 Nicholas (Jasper) Birla-Eliade
 * Tous droits réservés.
 *
 * Ce code et son contenu sont la propriété exclusive de Nicholas Birla-Eliade, aka Nick Jasper.
 * Aucune partie de ce code ne peut être reproduite, modifié, distribuée ou utilisée sans autorisation écrite préalable.
 */

class Joueur{
    constructor(x, y, meurt, collecteOr, prochain, detruire, bougeDebut, sonCharge, sonAjoute){
        this.x = x;
        this.y = y;
        this.pause = false;
        this.estMort = false;
        this.anim = 0;
        this.texture = "marche/1";
        this.flippe = 1;
        this.action = "";

        this.meurt = meurt;
        this.collecteOr = collecteOr;
        this.prochain = prochain;
        this.detruire = detruire;

        this.aBouge = false;
        this.bougeDebut = bougeDebut;

        this.sonAjoute = sonAjoute;
        this.sonCharge = sonCharge;

        this.sonTombe = new Audio("sons/tombe.mp3");
        this.sonTombe.addEventListener("canplaythrough", () => { sonCharge(); });
        this.sonAtteri = new Audio("sons/atteri.mp3");
        this.sonAtteri.addEventListener("canplaythrough", () => { sonCharge(); });
        this.sonAttrape = new Audio("sons/attrape.mp3");
        this.sonAttrape.addEventListener("canplaythrough", () => { sonCharge(); });
        this.sonMort = new Audio("sons/mort.mp3");
        this.sonMort.addEventListener("canplaythrough", () => { sonCharge(); });

        this.sonsEchelle = [];
        this.ChargeSons(this.sonsEchelle, 40, "sons/echelle/", ".wav")
        this.sonsEchellePrecedants = [];

        this.sonsBarre = [];
        this.ChargeSons(this.sonsBarre, 9, "sons/barre/", ".mp3")
        this.sonsBarrePrecedants = [];

        this.sonsPas = [];
        this.ChargeSons(this.sonsPas, 20, "sons/pas/", ".mp3")
        this.sonsPasPrecedants = [];
        this.pasCooldown = 0;
    }

    ChargeSons(array, compte, chemin, extension){
        for(let i = 0; i < compte; i++){ 
            array.push(new Audio(chemin + i.toString() + extension));
            this.sonAjoute();
            array[i].addEventListener("canplaythrough", () => { this.sonCharge(); });
        }
    }

    GetRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    Tick(x, haut, bas, tireDroite, tireGauche, map, ennemis, ticksSecondes){
        let dejaGrimpe = false;

        if(ticksSecondes < 15){
            return;
        }

        if((x != 0 || haut || bas) && !this.aBouge){
            this.aBouge = true;
            this.bougeDebut()
        }

        // Tester toucher
        for(let e in ennemis){
            let en = ennemis[e];
            if(Math.abs(en.x - this.x) < 8 && Math.abs(en.y - this.y) < 8 && !en.estPiege && !en.estMort){
                this.Mourrir();
            }
        }

        if(this.y <= 16){
            this.y = 16;
            this.Mourrir();
        }

        // Tester or
        if(map.EstOr(this.x + 8, this.y + 8)){
            map.DetruitTile(this.x + 8, this.y + 8);
            this.collecteOr();
        }

        // Tester prochain
        if(this.y > MAP_H * 16){
            this.prochain();
        }

        this.pasCooldown--;
        
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
                this.texture = "tire/" + Math.floor((this.anim - 1) / 6).toString();
                if(this.anim > 15){
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
                    this.Animer("grimpe", 4, 5);
                    this.JouerSonEchelle();
                }
                else if(map.EstEchelle(this.x + 6, this.y)){
                    this.y += 2;
                    xDesire = Math.floor((this.x + 6) / 16) * 16;
                    dejaGrimpe = true;
                    this.Animer("grimpe", 4, 5);
                    this.JouerSonEchelle();
                }
                if(this.x < xDesire){ this.x += 2; }
                else if(this.x > xDesire){ this.x -= 2; }
                if(map.EstEchelle(this.x + 8, this.y - 2) && map.EstVideOuBarre(this.x + 8, this.y)){
                    texture = "marche/1";
                }
            }
            // DESCENDRE ECHELLE
            else if(bas){
                let xDesire = this.x;
                if(map.EstEchelle(this.x + 9, this.y - 2)){
                    this.y -= 2;
                    xDesire = Math.floor((this.x + 9) / 16) * 16;
                    dejaGrimpe = true;
                    this.Animer("grimpe", 4, 5);
                    this.JouerSonEchelle();
                }
                else if(map.EstEchelle(this.x + 6, this.y - 2)){
                    this.y -= 2;
                    xDesire = Math.floor((this.x + 6) / 16) * 16;
                    dejaGrimpe = true;
                    this.Animer("grimpe", 4, 5);
                    this.JouerSonEchelle();
                }
                if(this.x < xDesire){ this.x += 2; }
                else if(this.x > xDesire){ this.x -= 2; }
            }

            // Snap au grid
            if(this.action == "tombe"){
                this.x = Math.floor(this.x);
            }
            else{
                this.sonTombe.pause();
                this.sonTombe.currentTime = 0;
                if(this.action != "barre"){
                    this.x = Math.floor(this.x / 2) * 2;
                }
            }
            
            // SUR LE SOL
            if(map.EstMarchable(ennemis, this.x + 4, this.y - 2) || map.EstMarchable(ennemis, this.x + 11, this.y - 2)){
                if(this.action == "tombe"){ 
                    this.texture = "marche/1";
                    this.action = "marche";
                    this.sonAtteri.play();
                }
                this.TickAtteri(x, dejaGrimpe, tireDroite, tireGauche, ennemis);
            }
            // SUR LA BARRE
            else if(this.EstSurBarre() && !bas){
                if(this.action != "barre"){
                    if(this.action == "tombe"){ 
                        this.sonAttrape.play();
                        this.JouerSonBarre();
                    };
                    this.action = "barre";
                    this.anim = 0;
                    this.texture = "barre/0";
                    this.sonTombe.pause();
                    this.sonTombe.currentTime = 0;
                }
                this.x += x * 1.5;
                if(x != 0){
                    this.Animer("barre", 4, 3);
                    this.flippe = -x;
                    this.JouerSonBarre();
                }
            }
            // TOMBER
            else if(map.EstTraversable(ennemis, this.x, this.y - 2) || map.EstTraversable(ennemis, this.x + 15, this.y - 2)){
                if(this.action != "tombe"){
                    this.sonTombe.play();
                    if(this.action == "barre"){
                        this.sonAttrape.play();
                    }
                }
                this.y -= 2;
                this.Animer("tombe", 4, 1);

                let xDesire = Math.floor((this.x + 8) / 16) * 16;
                if(xDesire > this.x){ this.x += 1; }
                else if(xDesire < this.x){ this.x -= 1; }

                if(!map.EstTraversable(ennemis, this.x + 8, this.y)){
                    this.y = this.GetPosTileY();
                    this.x = this.GetPosTileX();
                }
            }
            
            // TESTE COLLISION TERRAIN
            this.CalculerPointsDeCollisionTerrain(map);

            // Teste Suffocation
            if(this.collisionBG && this.collisionBD && this.collisionHG && this.collisionHD){
                this.Mourrir();
                return;
            }
            // Sorir du mur
            while(this.collisionBG || this.collisionBD || this.collisionHG || this.collisionHD){
                let xTemp = 0;
                let yTemp = 0;
                if(!this.collisionBG){ xTemp--; yTemp--; }
                if(!this.collisionBD){ xTemp++; yTemp--; }
                if(!this.collisionHG){ xTemp--; yTemp++; }
                if(!this.collisionHD){ xTemp++; yTemp++; }
                this.y += this.Clamp(yTemp, -1, 1);
                this.x += this.Clamp(xTemp, -1, 1);
                this.CalculerPointsDeCollisionTerrain(map);
            }
        }
    }

    Clamp(num, min, max){
        return Math.min(Math.max(num, min), max)
    }

    CalculerPointsDeCollisionTerrain(map){
        this.collisionBG = map.EstFermeInnocupe(this.x, this.y); // Bas gauche
        this.collisionBD = map.EstFermeInnocupe(this.x + 15, this.y); // Bas droite
        this.collisionHG = map.EstFermeInnocupe(this.x, this.y + 15); // Haut gauche
        this.collisionHD = map.EstFermeInnocupe(this.x + 15, this.y + 15); // Haut droit
    }

    TickAtteri(x, dejaGrimpe, tireDroite, tireGauche, ennemis){
        // DETRUIRE LE SOL
        if(map.EstMarchable(ennemis, this.x + 8, this.y - 2)){
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
        // DEPLACEMENT SOL GAUCHE
        if(x < 0 && !dejaGrimpe){
            if(!map.EstFermeOuBarreNonAligne(ennemis, this.x - 2, this.y) && (!map.EstFermeOuBarre(ennemis, this.x - 2, this.y + 14)) || map.EstBarreAligne(this.x - 2, this.y)){
                this.JouerSonPas(-1);
                this.x -= 2;
                this.Animer("marche", 4, 3);
                this.flippe = 1;
                return;
            }
            else if(map.EstBarre(this.x -2, this.y) || map.EstBarre(this.x -2, this.y + 14)){
                if(this.y < this.GetPosTileY() && map.EstTraversable(ennemis, this.x - 2, this.GetPosTileY())){
                    this.y += 2;
                    return;
                }
                else if(this.y > this.GetPosTileY() && map.EstTraversable(ennemis, this.x - 2, this.GetPosTileY())){
                    this.y -= 2;
                    return;
                }
            }
            if(map.EstTraversable(ennemis, this.x - 2, this.y)){
                this.y -= 2;
            }
            else if(map.EstTraversable(ennemis, this.x - 2, this.y + 14)){
                this.y += 2;
            }
        }
        // DEPLACEMENT SOL DROITE
        else if(x > 0 && !dejaGrimpe){
            if(!map.EstFermeOuBarreNonAligne(ennemis, this.x + 17, this.y) && !map.EstFermeOuBarre(ennemis, this.x + 17, this.y + 14) || map.EstBarreAligne(this.x + 17, this.y)){
                this.JouerSonPas(1);
                this.x += 2;
                this.Animer("marche", 4, 3);
                this.flippe = -1;
                return;
            }
            else if(map.EstBarre(this.x + 17, this.y) || map.EstBarre(this.x + 17, this.y + 14)){
                if(this.y < this.GetPosTileY() && map.EstTraversable(ennemis, this.x + 17, this.GetPosTileY())){
                    this.y += 2;
                    return;
                }
                else if(this.y > this.GetPosTileY() && map.EstTraversable(ennemis, this.x + 17, this.GetPosTileY())){
                    this.y -= 2;
                    return;
                }
            }
            if(map.EstTraversable(ennemis, this.x + 17, this.y)){
                this.y -= 2;
            }
            else if(map.EstTraversable(ennemis, this.x + 17, this.y + 14)){
                this.y += 2;
            }
        }
    }

    JouerSonPas(flippe){
        if(this.flippe == flippe || this.action != "marche"){ this.pasCooldown = -1; }
                
        if(this.pasCooldown < 0){
            this.pasCooldown = 8;
            let index = this.GetRandomInt(0, 19);
            while(this.sonsPasPrecedants.includes(index)){
                index = this.GetRandomInt(0, 19);
            }
            this.sonsPasPrecedants.push(index);
            if(this.sonsPasPrecedants.length > 10){
                this.sonsPasPrecedants.shift();
            }
            this.sonsPas[index].play();
        }
    }

    JouerSonEchelle(){
        if(this.action != "grimpe"){ this.pasCooldown = -1; }
                
        if(this.pasCooldown < 0){
            this.pasCooldown = 10;
            let index = this.GetRandomInt(0, 39);
            while(this.sonsEchellePrecedants.includes(index)){
                index = this.GetRandomInt(0, 39);
            }
            this.sonsEchellePrecedants.push(index);
            if(this.sonsEchellePrecedants.length > 25){
                this.sonsEchellePrecedants.shift();
            }
            this.sonsEchelle[index].play();
        }
    }

    JouerSonBarre(){
        if(this.action != "barre"){ this.pasCooldown = -1; }
                
        if(this.pasCooldown < 0){
            this.pasCooldown = 12;
            let index = this.GetRandomInt(0, 8);
            while(this.sonsBarrePrecedants.includes(index)){
                index = this.GetRandomInt(0, 8);
            }
            this.sonsBarrePrecedants.push(index);
            if(this.sonsBarrePrecedants.length > 5){
                this.sonsBarrePrecedants.shift();
            }
            this.sonsBarre[index].play();
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
            this.sonMort.play();
            this.sonTombe.pause();
            this.sonTombe.currentTime = 0;
        }
    }

    GetPosXDessin(taille){
        return this.x * taille;
    }

    GetPosYDessin(taille){
        return MAP_H * 16 * taille - this.y * taille;
    }

    GetPosTileX(){
        return Math.floor((this.x + 8)/ 16) * 16;
    }

    GetPosTileY(){
        return Math.floor((this.y + 8)/ 16) * 16;
    }
}