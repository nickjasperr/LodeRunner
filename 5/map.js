/*
 * © 2026 Nicholas (Jasper) Birla-Eliade
 * Tous droits réservés.
 *
 * Ce code et son contenu sont la propriété exclusive de Nicholas Birla-Eliade, aka Nick Jasper.
 * Aucune partie de ce code ne peut être reproduite, modifié, distribuée ou utilisée sans autorisation écrite préalable.
 */

class Map{

    constructor(jeu, revient, echelle, sonCharge, sonAjoute, placerCharacteres){
        this.sonCharge = sonCharge;
        this.sonAjoute = sonAjoute;
        
        this.sonsRemplit = [];
        for(let i = 0; i < 7; i++){ 
            this.sonsRemplit.push(new Audio("sons/remplit/" + i.toString() + ".mp3")); 
            this.sonAjoute();
            this.sonsRemplit[i].addEventListener("canplaythrough", () => { this.sonCharge(); });
        }
        this.sonsRemplitPrecedants = [];

        new Audio("sons/echelleTombe.mp3").addEventListener("canplaythrough", () => { this.sonCharge(); });
        new Audio("sons/orTombe.mp3").addEventListener("canplaythrough", () => { this.sonCharge(); });

        let mapString = jeu;
        let revientString = revient;
        let doitPlacerCharacteres = true;

        if(jeu == ""){
        mapString = 
`
    $
OOOOOOOHOOOOOOO
       H----------     $
       H    OOH   OOOOOOOHOO
       H    OOH          H
       H    OOH       $  H
OOHOOOOO    OOOOOOOOHOOOOOOO
  H                 H
  H                 H
OOOOOOOOOHOOOOOOOOOOH
         H          H
       $ H----------H   $
    HOOOOOO         OOOOOOOH
    H             $        H
OOOOOOOOOOOOOOOOOOOOOOOOOOOO
XXXXXXXXXXXXXXXXXXXXXXXXXXXX
`;
        revientString =
`............................
............................
............................
............................
............................
............................
............................
............................
............................
............................
............................
............................
............................
............................
############################
............................
............................
`;
            doitPlacerCharacteres = false;
        }

        this.map = [];
        this.revient = [];

        let ennemis = [];
        let joueur;

        let orMax = 0;
        
        let lignes = mapString.split("\n");
        for(let l = 0; l < MAP_H; l++){
            this.map[l] = [];

            let chars = lignes[l].split("");
            for(let c = 0; c < MAP_L; c++){
                let char = chars[c];
                if(char == "O"){
                    char = 240;
                }
                else if(!char){
                    char = " ";
                }
                else if(doitPlacerCharacteres){
                    if(char == "!"){
                        ennemis.push([c, MAP_H - l])
                        char = " ";
                    }
                    else if(char == "?"){
                        joueur = [c, MAP_H - l];
                        char = " ";
                    }
                    else if(char == "$"){
                        orMax++;
                    }
                }
                this.map[l][c] = char;
            }
        }
        lignes = revientString.split("\n");
        for(let l = 0; l < MAP_H; l++){
            let chars = lignes[l].split("");
            for(let c = 0; c < MAP_L; c++){
                let char = chars[c];
                if(char == "#"){
                    this.revient.push([c, MAP_H - l]);
                }
            }
        }

        if(doitPlacerCharacteres){
            placerCharacteres([joueur, ...ennemis], orMax);
        }
        this.descendreEchelle = false;
        this.animationEchelle = 0;
        this.echelleCoord = echelle;

        
    }

    GetRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    GetRandomSpawn(){
        return this.revient[this.GetRandomInt(0, this.revient.length -1)];
    }

    JouerSonRemplit(){
        let index = this.GetRandomInt(0, 6);
        while(this.sonsRemplitPrecedants.includes(index)){ index = this.GetRandomInt(0, 6); }
        this.sonsRemplitPrecedants.push(index);
        if(this.sonsRemplitPrecedants.length > 3){ this.sonsRemplitPrecedants.shift(); }

        this.sonsRemplit[index].play();
    }

    Tick(){
        for(let l in this.map){
            let ligne = this.map[l];
            for(let c in ligne){
                if(typeof ligne[c] === "number"){
                    if(ligne[c] < 240){
                        this.map[l][c] += 1;
                        if(this.map[l][c] == 240){
                            this.JouerSonRemplit();
                        }
                    }
                }
            }
        }

        if(this.descendreEchelle){
            this.animationEchelle++;
            let e = this.map[Math.floor(this.animationEchelle / 6)][this.echelleCoord];
            if(e == " " || e == "H" || e == "$"){
                this.map[Math.floor(this.animationEchelle / 6)][this.echelleCoord] = "H";
                if(e == " "){
                    new Audio("sons/echelleTombe.mp3").play();
                }
                if(this.map[Math.floor(this.animationEchelle / 6) + 1][this.echelleCoord] == "H"){
                    this.descendreEchelle = false;
                }
            }
            else{
                this.descendreEchelle = false;
            }
        }
    }

    GetTileTextures(zLayer, ticks){
        let map = [];
        for(let l in this.map){
            let ligne = this.map[l];
            map[l] = [];
            for(let c in ligne){
                let chemin = null;
                let tile = ligne[c];

                if(zLayer == 1){
                    if(typeof tile === "number"){
                        if(tile < 24){
                            chemin = "brique/" + Math.floor(tile / 4).toString();
                        }
                        else if(tile > 180){
                            let briqueNombre = (tile - 239) / 12;
                            if(briqueNombre > -6){
                                chemin = "brique/" + Math.floor(briqueNombre).toString();
                            }
                        }
                    }
                    else{
                        switch (tile){
                            case "X":
                                chemin = "beton";
                                break;
                        }
                    }
                }
                else if(zLayer == 0){
                    switch (tile){
                        case "H":
                            chemin = "echelle/" + Math.floor((ticks + 8) / 16 % 4).toString();
                            break;
                        case "-":
                            chemin = "barre";
                            break;
                        case "$":
                            chemin = "or/" + Math.floor((ticks + 2) / 4 % 4).toString();
                            break;
                        default:
                            chemin = "vide";
                    }
                }
                map[l][c] = chemin;
            }
        }
        return map;
    }

    GetTileTypeRaw(coord, intelligence){
        if(coord[1] >= MAP_H){ return " "; }
        if(coord[1] < 0){ 
            if(intelligence > 3){ return "~"; } return "X"; 
        }
        if(coord[0] < 0 || coord[0] >= MAP_L){ return "X"; }
        let row = MAP_H - coord[1];
        if(!this.map[row]){ return " "; }
        if(!this.map[row][coord[0]]){ return " "; }
        return this.map[row][coord[0]];
    }

    GetTileType(coord, intelligence, ennemis){
        let tile = this.GetTileTypeRaw(coord, intelligence);
        if(typeof tile === "number"){ 
            if(intelligence > 3 && tile > 16 && tile < 236){
                if(!this.EstEnnemiPiege(ennemis, coord[0] * 16, coord[1] * 16)){
                    return "~";
                }
            }
            return "O"; 
        }
        else if(tile == "$"){ return " "; }
        else if(tile == "X"){ return "O"; }
        return tile;
    }

    Clamp(num, min, max){
        return Math.min(Math.max(num, min), max)
    }

    GetTile(x, y){
        if(y > MAP_H * 16){ return " "; }
        else if(y < 0 || x > MAP_L * 16 || x < 0){ return "X"; }
        return this.map[this.Clamp(Math.floor(MAP_H - (y - 15) / 16), 0, MAP_H - 1)][this.Clamp(Math.floor(x / 16), 0, MAP_L - 1)];
    }

    SetTile(x, y, nouveau){
        this.map[Math.floor(MAP_H - (y - 15) / 16)][Math.floor(x / 16)] = nouveau;
    }

    EstEnnemiPiege(ennemis, x, y){
        let tempX = Math.floor(x / 16) * 16;
        let tempY = Math.floor(y / 16) * 16;
        for(let e in ennemis){
            let en = ennemis[e];
            if(en.piegeX == tempX && en.piegeY == tempY){ return true; }
        }
        return false;
    }

    EstEchelle(x, y){
        return this.GetTile(x, y) == "H";
    }

    EstBarre(x, y){
        return this.GetTile(x, y) == "-";
    }

    EstBarreAligne(x, y){
        return this.GetTile(x, y) == "-" && y % 16 == 0;
    }

    EstOr(x, y){
        return this.GetTile(x, y) == "$";
    }

    EstAir(x, y){
        return this.GetTile(x, y) == " ";
    }

    EstBrique(x, y){
        return typeof this.GetTile(x, y) === "number";
    }

    EstBriqueFerme(x, y){
        if(this.EstBrique(x, y)){
            return this.GetTile(x, y) > 239;
        }
        return false;
    }

    EstBriqueNonFerme(x, y){
        if(this.EstBrique(x, y)){
            return this.GetTile(x, y) < 240;
        }
        return false;
    }

    EstCement(x, y){
        return this.GetTile(x, y) == "X" || x < 0 || x > MAP_L * 16;
    }

    EstFerme(ennemis, x, y){
        return this.EstBriqueFerme(x, y) || this.EstCement(x, y) || this.EstEnnemiPiege(ennemis, x, y);
    }

    EstFermeOuBarre(ennemis, x, y){
        return this.EstFerme(ennemis, x, y) || this.EstBarre(x, y);
    }

    EstFermeOuBarreNonAligne(ennemis, x, y){
        return this.EstFerme(ennemis, x, y) || (this.EstBarre(x, y) && y % 16 != 0);
    }

    EstFermeInnocupe(x, y){
        return this.EstBriqueFerme(x, y) || this.EstCement(x, y);
    }

    EstMarchableSimple(x, y){
        return this.EstBrique(x, y) || this.EstCement(x, y) || this.EstEchelle(x, y);
    }

    EstMarchable(ennemis, x, y){
        return this.EstBriqueFerme(x, y) || this.EstCement(x, y) || this.EstEchelle(x, y) || this.EstEnnemiPiege(ennemis, x, y);
    }

    EstMarchablePourEnnemi(ennemis, x, y, intelligence){
        if(intelligence > 3){
            if(!this.EstVide(x, y + 16)){ return true; }
            if(this.EstBrique(x, y)){
                return this.GetTile(x, y) > 232 || this.GetTile(x, y) < 12 || this.EstEnnemiPiege(ennemis, x, y);
            }
        }
        return true;
    }

    EstTirable(ennemis, x, y){
        return this.EstBriqueFerme(x, y) && !this.EstMarchable(ennemis, x, y + 16) && !this.EstOr(x, y + 16) && !this.EstBarre(x, y + 16) || this.EstEnnemiPiege(ennemis, x, y + 16);
    }

    EstVide(x, y){
        return this.EstAir(x, y) || this.EstOr(x, y);
    }

    EstTraversable(ennemis, x, y){
        return ( this.EstBrique(x, y) && !this.EstFerme(ennemis, x, y) ) || this.EstVide(x, y) || this.EstBarre(x, y);
    }

    EstVideOuBarre(x, y){
        return this.EstVide(x, y) && this.EstBarre(x, y);
    }

    DetruitTile(x, y){
        if(this.EstBriqueFerme(x, y)){
            this.SetTile(x, y, 0);
        }
        else{
            this.SetTile(x, y, " ");
        }
    }

    PlacerOr(x, y){
        this.SetTile(x, y, "$");
        new Audio("sons/orTombe.mp3").play();
    }
}