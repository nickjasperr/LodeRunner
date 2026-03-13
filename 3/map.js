

class Map{

    constructor(nom){
        this.sonsRemplit = [];
        for(let i = 0; i < 7; i++){ 
            this.sonsRemplit.push(new Audio("sons/remplit/" + i.toString() + ".mp3")); 
        }
        this.sonsRemplitPrecedants = [];

        let mapString = 
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
`
        
        this.map = [];
        
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
                this.map[l][c] = char;
            }
        }

        this.descendreEchelle = false;
        this.animationEchelle = 0;
        this.echelleCoord = 18;
    }

    GetRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
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
            if(e == " " || e == "H" ){
                this.map[Math.floor(this.animationEchelle / 6)][this.echelleCoord] = "H";
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

    GetTileType(coord, intelligence, ennemis){
        if(coord[1] >= MAP_H){ return " "; }
        let tile = this.map[MAP_H - coord[1]][coord[0]];
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

    GetTile(x, y){
        return this.map[Math.floor(MAP_H - (y - 15) / 16)][Math.floor(x / 16)];
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

    EstFermeInnocupe(x, y){
        return this.EstBriqueFerme(x, y) || this.EstCement(x, y);
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

    DetruitTile(x, y){
        if(this.EstBriqueFerme(x, y)){
            this.SetTile(x, y, 0);
        }
        else{
            this.SetTile(x, y, " ");
        }
    }

    PlacerOr(x, y){
        let tempY = y;
        while(!this.EstAir(x, tempY)){
            tempY += 16;
        }
        this.SetTile(x, tempY, "$");
    }
}