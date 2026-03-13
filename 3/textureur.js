

class Textureur{
    constructor(finiLoad){
        this.textures = {};

        this.chemins = ["barre", "beton", "vide"];

        let groupes = [
            "4or", "4echelle",
            "4ennemi/barre", "4ennemi/grimpe", "4ennemi/marche", "4ennemi/revient", "2ennemi/tombe",
            "4joueur/barre", "4joueur/gagne", "4joueur/grimpe", "4joueur/marche", 
            "8joueur/mort", "3joueur/tire",  "4joueur/tombe"
        ];

        for(const e in groupes){
            for(let i = 0; i < groupes[e][0]; i++){
                this.chemins.push(groupes[e].slice(1) + "/" + i.toString());
                if(groupes[e].length > 7){
                    if(groupes[e].slice(1, 8) == "ennemi/"){
                        this.chemins.push("ennemi_or/" + groupes[e].slice(8) + "/" + i.toString());
                    }
                }
            }
        }

        for(let i = -5; i < 6; i++){
            this.chemins.push("brique/" + i.toString());
        }

        for(let e = 0; e < 3; e++){
            for(let i = 0; i < 5; i++){
                this.chemins.push("particules/" + e.toString() + i.toString());
            }
        }

        let compteLoaded = 0;

        for(const e in this.chemins){
            const img = new Image();
            img.src = "textures/" + this.chemins[e] + ".png";
            img.onload = () => {
                compteLoaded++;
                if(compteLoaded == this.chemins.length){
                    finiLoad();
                }
            }
            this.textures[this.chemins[e]] = img;
        }
    }

    Get(chemin){
        return this.textures[chemin];
    }
}