

class Map{

    constructor(nom){
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

    Tick(){
        for(let l in this.map){
            let ligne = this.map[l];
            for(let c in ligne){
                if(typeof ligne[c] === "number"){
                    if(ligne[c] < 240){
                        this.map[l][c] += 1;
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

    GetTile(x, y){
        return this.map[Math.floor(MAP_H - (y - 15) / 16)][Math.floor(x / 16)];
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

    EstTirable(ennemis, x, y){
        return this.EstBriqueFerme(x, y) && !this.EstMarchable(ennemis, x, y + 16) && !this.EstOr(x, y + 16) && !this.EstBarre(x, y + 16) || this.EstEnnemiPiege(ennemis, x, y + 16);
    }

    EstVide(ennemis, x, y){
        return ( this.EstBrique(x, y) && !this.EstFerme(ennemis, x, y) ) || this.EstAir(x, y) || this.EstBarre(x, y) || this.EstOr(x, y);
    }

    DetruitTile(x, y){
        if(this.EstBriqueFerme(x, y)){
            this.map[Math.floor(MAP_H - (y - 15) / 16)][Math.floor(x / 16)] = 0;
        }
        else{
            this.map[Math.floor(MAP_H - (y - 15) / 16)][Math.floor(x / 16)] = " ";
        }
    }
}