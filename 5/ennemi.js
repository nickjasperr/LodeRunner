/*
 * © 2026 Nicholas (Jasper) Birla-Eliade
 * Tous droits réservés.
 *
 * Ce code et son contenu sont la propriété exclusive de Nicholas Birla-Eliade, aka Nick Jasper.
 * Aucune partie de ce code ne peut être reproduite, modifié, distribuée ou utilisée sans autorisation écrite préalable.
 */

class Ennemi{
    constructor(x, y, map, index, piege, meurt){
        this.map = map;
        this.x = x;
        this.y = y;
        this.index = index;

        this.anim = 0;
        this.texture = "marche/1";
        this.flippe = 1;
        this.action = "";

        this.estPiege = false;
        this.compteOr = 0;
        this.cooldownPlacerOr = 0;
        this.cooldownCollecteOr = 0;

        this.piegeX = -1;
        this.piegeY = -1;
        this.piegeCooldown = 0;

        this.piege = piege;
        this.meurt = meurt;

        this.chemin = [];
        this.cooldownCheminChange = 0;

        this.dessinerLigneDebug = false;
    }


    CheminEnString(chemin, raccourcir = false){
        let string = "";
        let min = 0;
        let max = chemin.length;
        if(raccourcir){ 
            min = Math.floor(chemin.length * 0.3); 
            max = this.Clamp(Math.floor(chemin.length * 0.6), 2, chemin.length);
        }
        for(let c = min; c < max; c++){
            string += chemin[c][0] + "," + chemin[c][1] + ".";
        }
        return string;
    }


    CheminEstInterdit(cheminString){
        for(let ch in this.cheminsInterdits){
            if(cheminString.includes(this.cheminsInterdits[ch])){
                return true;
            }
        }
        return false;
    }

    GetRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }


    CalculerMouvement(intelligence, joueurX, joueurY, map, ennemis){
        this.xOffset = 0;
        this.haut = false;
        this.bas = false;

        this.intelligence = intelligence;
        let distance = this.Distance([this.x / 16, this.y / 16], [joueurX, joueurY]);

        if(intelligence == 0){
            // Aucun AI
            return;
        }
        if(intelligence > 1 && this.action != "tombe"){
            this.dessinerLigneDebug = true;
            // Pathfindind complexe
            this.origine = [this.GetPosTileX() / 16, this.GetPosTileY() / 16];
            this.chemins = [{"cout": 0, "distance": this.Distance(this.origine, [joueurX, joueurY]), "contact": false, "coords": [this.origine]}];
            this.maxLongeurChemin;
            this.poidsDuCout;
            this.coutParIntersection;

            // Intelligence Presets
            switch(intelligence){
                case 2: 
                    this.maxLongeurChemin = 10; 
                    this.poidsDuCout = 10;
                    this.coutParIntersection = 50;
                    break;
                case 3:
                    this.maxLongeurChemin = 20;
                    this.poidsDuCout = 20;
                    this.coutParIntersection = 100;
                    break;
                case 4:
                    this.maxLongeurChemin = 40;
                    this.poidsDuCout = 30;
                    this.coutParIntersection = 150;
                    break;
            }
            
            // Choisir Chemin
            this.cooldownCheminChange--;
            if(this.cooldownCheminChange < 0){
                
                this.Pathfind(map, ennemis, [joueurX + 8, joueurY + 8], 0);

                let plusPetit = 1000000000;
                let choixPrefere = 0;
                for(let c in this.chemins){
                    let ch = this.chemins[c];
                    if(ch.cout == -100000){ continue; }
                    let offsetContact = 0;
                    if(ch.contact){offsetContact = -500};
                    let scoreChemin = ch.distance + ch.cout * this.poidsDuCout + offsetContact;
                    if(scoreChemin < plusPetit){ 
                        choixPrefere = c; plusPetit = scoreChemin;
                    }
                }
                this.chemin = this.chemins[choixPrefere].coords;
                this.cooldownCheminChange = this.Clamp(this.chemin.length, 4, 8);
            }
            
            // Affecter mouvement
            let comparable = 1;
            if(this.chemin.length > 2){ comparable = 2; }
            if(this.chemin.length > 1){
                this.xOffset = this.Clamp((this.chemin[comparable][0] * 16 - this.x) * 10, -1, 1);
                if(this.xOffset > 0){ 
                    for(let e in ennemis){
                        if(ennemis[e].GetDirectionOccupe(this.x, this.y, "+", this.index)){ this.xOffset = 0; }
                    }
                }
                else if(this.xOffset < 0){ 
                    for(let e in ennemis){
                        if(ennemis[e].GetDirectionOccupe(this.x, this.y, "-", this.index)){ this.xOffset = 0; }
                    }
                }
                let yPrefere = this.chemin[1][1] * 16 - this.y;
                if(yPrefere > 0){ this.haut = true; }
                else if(yPrefere < 0){ this.bas = true; }
            }
        }
        if(intelligence == 1 || (this.chemin.length == 1) || distance < 500){
            // Simple déplacement
            this.dessinerLigneDebug = false;
            if(intelligence < 2 || !this.EstSurBarre(map)){
                if(joueurY > this.y){ this.haut = true; }
                else if(joueurY < this.y){ this.bas = true; }
            }

            if(joueurX > this.x){ 
                for(let e in ennemis){
                    if(ennemis[e].GetDirectionOccupe(this.x, this.y, "+", this.index)){ return; }
                }
                this.xOffset = 1; 
            }
            else if(joueurX < this.x){ 
                for(let e in ennemis){
                    if(ennemis[e].GetDirectionOccupe(this.x, this.y, "-", this.index)){ return; }
                }
                this.xOffset = -1; 
            }
        }
    }

    Pathfind(map, ennemis, posJoueur, indexChemin){
        let chemin = this.chemins[indexChemin]
        let cout = chemin.cout;
        let coords = chemin.coords;
        if(coords.length > this.maxLongeurChemin){ return; }

        let coordCible = coords.at(-1);
        let coordDroite = [coordCible[0] + 1, coordCible[1]];
        let coordGauche = [coordCible[0] - 1, coordCible[1]];
        let coordHaut = [coordCible[0], coordCible[1] + 1];
        let coordBas = [coordCible[0], coordCible[1] - 1];
        let coordBasDroite = [coordCible[0] + 1, coordCible[1] - 1];
        let coordBasGauche = [coordCible[0] - 1, coordCible[1] - 1];

        // Tester contact avec joueur
        this.chemins[indexChemin].contact = 
            this.intelligence > 2 && 
            Math.abs(posJoueur[0] - coordCible[0] * 16) < 16 && 
            Math.abs(posJoueur[1] - coordCible[1] * 16) < 16;
        
        // Tester contact avec autres
        for(let e in ennemis){
            let en = ennemis[e];
            if(coordCible[0] == en.GetPosTileX() / 16 && coordCible[1] == en.GetPosTileY() / 16 && en.index != this.index){
                cout += this.coutParIntersection;
            }
        }

        switch (map.GetTileType(coordCible, this.intelligence, ennemis)){
            // ===== DANS LE VIDE =====
            case " ":
                switch (map.GetTileType(coordBas, this.intelligence, ennemis)){
                    // ON TOMBE
                    case " ":
                        let tempCoords = [...coords];
                        let continu = true;
                        let coutOffset = 0;
                        while(continu){
                            let cible = tempCoords.at(-1);
                            let bas = [cible[0], cible[1] - 1];
                            if(map.GetTileType(bas, this.intelligence, ennemis) == " "){
                                coutOffset += 2;
                                tempCoords.push(bas);
                            }
                            else{
                                if(map.GetTileType(bas, this.intelligence, ennemis) == "~"){
                                    this.chemins[indexChemin] = {"cout": -100000};
                                }
                                else if(!tempCoords.some(c => c[0] == cible[0] && c[1] == cible[1])){
                                    this.chemins[indexChemin] = {"cout": -100000};
                                }
                                else{
                                    this.chemins[indexChemin] = {"cout": cout + coutOffset, "distance": this.Distance(coordBas, posJoueur), "coords": [...coords, coordBas]};
                                    this.Pathfind(map, ennemis, posJoueur, indexChemin);
                                }
                                continu = false;
                            }
                        }
                        break;
                    // Descend Echelle
                    case "H":
                        if(!coords.some(c => c[0] == coordBas[0] && c[1] == coordBas[1])){
                            this.chemins.push({"cout": cout + 3, "distance": this.Distance(coordBas, posJoueur), "coords": [...coords, coordBas]});
                            this.Pathfind(map, ennemis, posJoueur, this.chemins.length - 1);
                        }
                    // Droite/Gauche
                    case "O":
                        this.PathfindDeplacementHorizontal(map, ennemis, chemin, posJoueur, coordDroite, coordBasDroite);
                        this.PathfindDeplacementHorizontal(map, ennemis, chemin, posJoueur, coordGauche, coordBasGauche);
                        break;
                    // Tombe sur Barre
                    case "-":
                        if(!coords.some(c => c[0] == coordBas[0] && c[1] == coordBas[1])){
                            this.chemins.push({"cout": cout, "distance": this.Distance(coordBas, posJoueur), "coords": [...coords, coordBas]});
                            this.Pathfind(map, ennemis, posJoueur, this.chemins.length - 1);
                        }
                        break;
                    

                }
                break
            // ===== SUR UNE ECHELLE =====
            case "H":
                // Descend
                if(!coords.some(c => c[0] == coordBas[0] && c[1] == coordBas[1])){
                    switch(map.GetTileType(coordBas, this.intelligence, ennemis)){
                        case "O": break;
                        default:
                            this.chemins.push({"cout": cout + 5, "distance": this.Distance(coordBas, posJoueur), "coords": [...coords, coordBas]});
                            this.Pathfind(map, ennemis, posJoueur, this.chemins.length - 1);
                            break;
                    }
                }
                // Monte
                if(!coords.some(c => c[0] == coordHaut[0] && c[1] == coordHaut[1])){
                    switch(map.GetTileType(coordHaut, this.intelligence, ennemis)){
                        case "O": break;
                        default:
                            this.chemins.push({"cout": cout + 3, "distance": this.Distance(coordHaut, posJoueur), "coords": [...coords, coordHaut]});
                            this.Pathfind(map, ennemis, posJoueur, this.chemins.length - 1);
                            break;
                    }
                }
                // Droite
                if(
                    (map.GetTileType(coordBasDroite, this.intelligence, ennemis) != " " &&
                    map.GetTileType(coordBasDroite, this.intelligence, ennemis) != "-") ||
                    map.GetTileType(coordDroite, this.intelligence, ennemis) == "-"
                ){
                    this.PathfindDeplacementHorizontal(map, ennemis, chemin, posJoueur, coordDroite, coordBasDroite);
                }
                // Gauche
                if(
                    (map.GetTileType(coordBasGauche, this.intelligence, ennemis) != " " &&
                    map.GetTileType(coordBasGauche, this.intelligence, ennemis) != "-") ||
                    map.GetTileType(coordGauche, this.intelligence, ennemis) == "-"
                ){
                    this.PathfindDeplacementHorizontal(map, ennemis, chemin, posJoueur, coordGauche, coordBasGauche);
                }
                break;
            // ===== SUR UNE BARRE =====
            case "-":
                // Descend
                if(!coords.some(c => c[0] == coordBas[0] && c[1] == coordBas[1])){
                    switch(map.GetTileType(coordBas, this.intelligence, ennemis)){
                        case "O": break;
                        default:
                            this.chemins.push({"cout": cout + 4, "distance": this.Distance(coordBas, posJoueur), "coords": [...coords, coordBas]});
                            this.Pathfind(map, ennemis, posJoueur, this.chemins.length - 1);
                            break;
                    }
                }
                // Droite
                this.PathfindDeplacementHorizontal(map, ennemis, chemin, posJoueur, coordDroite, coordBasDroite);
                // Gauche
                this.PathfindDeplacementHorizontal(map, ennemis, chemin, posJoueur, coordGauche, coordBasGauche);
                break;
        }
    }

    PathfindDeplacementHorizontal(map, ennemis, chemin, posJoueur, coord, coordCoin){
        if(!chemin.coords.some(c => c[0] == coord[0] && c[1] == coord[1])){
            let tempCout = 4;
            let tempCoordType = map.GetTileType(coord, this.intelligence, ennemis);
            switch(tempCoordType){
                case "O": break;
                case "-": tempCout = 3;
                case " ":
                case "H":
                    if(tempCoordType != "-")
                    {
                        if(map.GetTileType(coordCoin, this.intelligence, ennemis) == "~"){
                            tempCout = 160 - map.GetTileTypeRaw(coordCoin, this.intelligence);
                        }
                    }
                    this.chemins.push({"cout": chemin.cout + tempCout, "distance": this.Distance(coord, posJoueur), "coords": [...chemin.coords, coord]});
                    this.Pathfind(map, ennemis, posJoueur, this.chemins.length - 1);
                    break;
            }
        }
    }


    Distance(ennemi, joueur){
        const deltaX = ennemi[0] * 16 - joueur[0];
        const deltaY = ennemi[1] * 16 - joueur[1];
        return Math.pow(deltaX, 2) + Math.pow(deltaY, 2);
    }


    Tick(map, ennemis){
        let dejaGrimpe = false;

        // Collecte or
        this.cooldownCollecteOr--;
        if(map.EstOr(this.x + 8, this.y + 8) && !this.compteOr < 2 && this.cooldownCollecteOr < 0){
            map.DetruitTile(this.x + 8, this.y + 8);
            this.compteOr++;
            if(this.compteOr > 1){
                this.cooldownPlacerOr = this.GetRandomInt(180, 360);
            }
            else{
                this.cooldownPlacerOr = this.GetRandomInt(300, 600);
            }
        }

        // Placer or
        this.cooldownPlacerOr--;
        if(this.cooldownPlacerOr < 0){
            if(this.PlacerOr()){
                 this.cooldownPlacerOr = this.GetRandomInt(300, 600);
            }
            this.cooldownPlacerOr = this.GetRandomInt(90, 180);
        }
        
        // Animation de revivement
        if(this.estMort){
            this.anim++;
            let numTemp = Math.floor((this.anim - 1) / 8);
            if(numTemp > 3){
                this.estMort = false;
                this.texture = "marche/1";
            }
            else{ this.texture = "revient/" + numTemp.toString(); }
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
                if(map.EstEchelle(this.x + 9, this.y - 2) || map.EstEchelle(this.x + 9, this.y + 15)){
                    this.y -= 1;
                    xDesire = Math.floor((this.x + 9) / 16) * 16;
                    dejaGrimpe = true;
                    this.Animer("grimpe", 4, 4);
                }
                else if(map.EstEchelle(this.x + 6, this.y - 1)){
                    this.y -= 1;
                    xDesire = Math.floor((this.x + 6) / 16) * 16;
                    dejaGrimpe = true;
                    this.Animer("grimpe", 4, 4);
                }
                if(this.x < xDesire){ this.x += 1; }
                else if(this.x > xDesire){ this.x -= 1; }
            }

            // Snap au grid si pas entrain de tomber
            if(this.action != "tombe"){
                this.x = Math.floor(this.x);
                this.y = Math.floor(this.y);
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
                    this.piegeX = this.GetPosTileX();
                    this.piegeY = this.GetPosTileY();
                    this.anim = 0;
                    this.piege();
                    this.PlacerOr();
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
                if(this.anim > 104){
                    this.y = this.piegeY + this.anim - 104;
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
            else if(map.EstMarchable(ennemis, this.x + 4, this.y - 1) || map.EstMarchable(ennemis, this.x + 11, this.y - 1) || this.piegeCooldown > -1){
                if(this.action == "tombe"){ 
                    this.texture = "marche/1";
                    this.action = "marche";
                }
                this.TickAtteri(dejaGrimpe, ennemis, map);
            }
            // SUR LA BARRE
            else if(this.EstSurBarre(map)){
                if(this.action != "barre"){
                    this.action = "barre";
                    this.anim = 0;
                    this.texture = "barre/0";
                }
                this.x += this.xOffset;
                if(this.xOffset != 0){
                    this.Animer("barre", 4, 3);
                    this.flippe = -this.xOffset;
                }
                if(this.bas){
                    if(this.intelligence > 3){
                        let tempY = this.y - 16;
                        let continu = true;
                        while(continu){
                            if(map.EstVide(this.x, tempY)){
                                tempY -= 16;
                            }
                            else if(map.EstMarchablePourEnnemi(ennemis, this.x + 8, tempY, this.intelligence)){
                                this.y -= 2;
                                this.Animer("tombe", 2, 1);
                                continu = false;
                            }
                            else{
                                continu = false;
                            }
                        }
                    }
                    else{
                        this.y -= 2;
                        this.Animer("tombe", 2, 1);
                    }
                }
            }
            // TOMBER
            else if(map.EstTraversable(ennemis, this.x, this.y - 1) || map.EstTraversable(ennemis, this.x + 15, this.y - 1) && !this.EstDansBrique(map)){
                this.y -= 1.5;
                this.Animer("tombe", 2, 2);

                let xDesire = this.GetPosTileX();
                if(xDesire > this.x){ this.x += 1; }
                else if(xDesire < this.x){ this.x -= 1; }

                if(!map.EstTraversable(ennemis, this.x + 8, this.y - 0.5)){
                    this.y = this.GetPosTileY();
                    this.x = this.GetPosTileX();
                }
            }

            // TESTE COLLISION TERRAIN
            this.CalculerPointsDeCollisionTerrain(map);

            // Teste Suffocation
            if(
                (this.collisionBG && this.collisionBD && this.collisionHG && this.collisionHD)
                || (this.estPiege && map.EstFermeInnocupe(this.piegeX, this.piegeY))){
                this.Mourrir(ennemis, map);
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

    TickAtteri(dejaGrimpe, ennemis, map){
        // DEPLACEMENT SOL DROITE
        if(this.xOffset < 0 && !dejaGrimpe){
            if((!map.EstFerme(ennemis, this.x - 1, this.y) && !map.EstFerme(ennemis, this.x - 1, this.y + 15)) || this.piegeCooldown > -1){
                if(map.EstMarchablePourEnnemi(ennemis, this.x - 2, this.y - 2, this.intelligence)){
                    this.x -= 1;
                    this.Animer("marche", 4, 4);
                    this.flippe = 1;
                }
                else{
                    if(!map.EstMarchablePourEnnemi(ennemis, this.x - 1, this.y - 2, this.intelligence)){
                        this.x += 1;
                        this.Animer("marche", 4, 4);
                        this.flippe = -1;
                    }
                    else{
                        this.texture = "marche/1";
                        this.anim = 0;
                    }
                }
            }
            else if(map.EstTraversable(ennemis, this.x - 1, this.y)){
                this.y -= 2;
            }
            else if(map.EstTraversable(ennemis, this.x - 1, this.y + 15)){
                this.y += 2;
            }
        }
        // DEPLACEMENT SOL GAUCHE
        else if(this.xOffset > 0 && !dejaGrimpe){
            if((!map.EstFerme(ennemis, this.x + 16, this.y) && !map.EstFerme(ennemis, this.x + 16, this.y + 15)) || this.piegeCooldown > -1){
                if(map.EstMarchablePourEnnemi(ennemis, this.x + 17, this.y - 2, this.intelligence)){
                    this.x += 1;
                    this.Animer("marche", 4, 4);
                    this.flippe = -1;
                }
                else{
                    if(!map.EstMarchablePourEnnemi(ennemis, this.x + 16, this.y - 2, this.intelligence)){
                        this.x -= 1;
                        this.Animer("marche", 4, 4);
                        this.flippe = 1;
                    }
                    else{
                        this.texture = "marche/1";
                        this.anim = 0;
                    }
                }
            }
            else if(map.EstTraversable(ennemis, this.x + 16, this.y)){
                this.y -= 2;
            }
            else if(map.EstTraversable(ennemis, this.x + 16, this.y + 15)){
                this.y += 2;
            }
        }
    }

    EstSurBarre(map){
        if(this.y % 16 < 2){
            return map.EstBarre(this.x + 6, this.y + 2) || map.EstBarre(this.x + 9, this.y + 2);
        }
        return false;
    }

    EstDansBrique(map){
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

    Mourrir(ennemis, map){
        if(!this.estMort){
            this.texture = "revient/0";
            this.estMort = true;
            this.estPiege = false;
            this.anim = 0;
            let spawn = map.GetRandomSpawn();
            while(map.GetTileType(spawn) == "O"){
                spawn = map.GetRandomSpawn();
            }
            this.y = spawn[1] * 16;
            this.x = spawn[0] * 16;
            this.meurt();
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

    GetDirectionOccupe(x, y, direction, index){
        if(this.estPiege || this.estMort){ return false; }
        if(this.index === index){ return false; }
        if(this.x == x && Math.abs(this.y - y) < 8){ return this.index < index; }

        let xTemp = this.x - x;
        if(Math.abs(this.y - y) < 17){
            if(direction == "+"){ return 0 < xTemp && xTemp < 17; }
            else if(direction == "-"){ return -17 < xTemp && xTemp < 0; }
        }
        return false;
    }

    PlacerOr(){
        if(this.estPiege && this.compteOr > 0 && map.EstAir(this.piegeX, this.piegeY + 16)){
            this.compteOr--;
            map.PlacerOr(this.piegeX, this.piegeY + 16);
            return true;
        }
        else if(this.compteOr > 0 && map.EstAir(this.GetPosTileX(), this.GetPosTileY()) && map.EstMarchableSimple(this.GetPosTileX(), this.GetPosTileY() - 16)){
            this.compteOr--;
            map.PlacerOr(this.GetPosTileX(), this.GetPosTileY());
            this.cooldownCollecteOr = 30;
            return true;
        }
        return false;
    }
}