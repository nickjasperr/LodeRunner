// ========== CONSTANTS ==========

window.MAP_L = 28;
window.MAP_H = 17;

let tailleTile;

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

function GetRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

let vies = 5;

const gameover = new Audio("gameover.mp3");
const sondOr = new Audio("or.mp3");
const sondCreuse = new Audio("creuse.mp3");
const perdvie = new Audio("vie.mp3");
const termine = new Audio("termine.mp3");
const musique = new Audio("music.mp3");

// ========== INPUT ==========

let haut = false;
let bas = false;
let gauche = 0;
let droite = 0;
let tireGauche = false;
let tireDroite = false;

window.addEventListener("keydown", (event) => {
    switch(event.key){
        case "ArrowUp": haut = true; break;
        case "ArrowDown": bas = true; break;
        case "ArrowLeft": gauche++; break;
        case "ArrowRight": droite++; break;
        case "z": tireGauche = true; break;
        case "x": tireDroite = true; break;
    }
});
window.addEventListener("keyup", (event) => {
    switch(event.key){
        case "ArrowUp": haut = false; break;
        case "ArrowDown": bas = false; break;
        case "ArrowLeft": gauche = 0; break;
        case "ArrowRight": droite = 0; break;
        case "z": tireGauche = false; break;
        case "x": tireDroite = false; break;
    }
});


function ResetInterval(){
    for (let i = 1; i <= 10; i++) { clearInterval(i); } // Cela enlève les 10 premiers intervales, sans cela on peut avoid un bogue
    clearInterval(intervalId);
    intervalId = setInterval(Tick, 1000/vitesse);
}


// ========== CONTROLES ==========

let taille = 3;
let vitesse = 30;
let intelligence = 3;
let debogue = false;

let intervalId;

// Taille Slider
const tailleSlider = document.getElementById("sliderTaille");
tailleSlider.oninput = function(){
    taille = parseInt(tailleSlider.value);
    document.getElementById("labelTaille").textContent = taille;

    UpdateTaille();
}

function UpdateTaille(){
    tailleTile = 16 * taille;

    canvas.width = MAP_L * tailleTile;
    canvas.height = (MAP_H + 1) * tailleTile;

    if(vies == 0){
        GameOver();
    }

    ctx.imageSmoothingEnabled = false;
}

UpdateTaille();

// Vitesse Slider
const vitesseSlider = document.getElementById("sliderVitesse");
vitesseSlider.oninput = function(){
    vitesse = parseInt(vitesseSlider.value);
    document.getElementById("labelVitesse").textContent = (vitesse / 30).toFixed(1);
    ResetInterval();
}

// Intelligence Slider
const intelligenceSlider = document.getElementById("sliderIntelligence");
intelligenceSlider.oninput = function(){
    intelligence = parseInt(intelligenceSlider.value);
    document.getElementById("labelIntelligence").textContent = (intelligence).toString();
}

const debogueCheckbox = document.getElementById("checkboxDebogue");
debogueCheckbox.addEventListener("change", () =>{
    debogue = debogueCheckbox.checked;
});


// ========== GAME STATE ==========

let paused = false;
let ticksSecondes = 0;
let ticksAnimation = 0;
let joueur;
let map;

let or = 0;
let score = 0;
let niveau = 1;
let scorePrecedant = 0;

let particules = [];
let ennemis = [];
let positionsEnnemis = [];


// ========== DEBUTER ==========

textureur = new Textureur(Debuter);

function Debuter(){
    intervalId = setInterval(Tick,1000/vitesse);
    Recommencer();
}

function Recommencer(){
    ticksSecondes = 0;
    ticksAnimation = 0;
    score = scorePrecedant;
    or = 0;
    ResetInterval();
    joueur = new Joueur(Meurt, CollecteOr, Gagner, Detruire, BougeDebut);
    map = new Map("1");

    ennemis = [];
    positionsEnnemis = [];
    let ennemisIndex = 0;
    let tempX;
    let tempY;
    let cont = true;

    while(cont){
        tempX = Math.floor(GetRandomInt(0, MAP_L) * 16);
        tempY = Math.floor(GetRandomInt(4, MAP_H) * 16);
        if(map.EstAir(tempX, tempY) && map.EstFermeInnocupe(tempX, tempY - 16) && !positionsEnnemis.includes([tempX, tempY])){
            ennemis.push(new Ennemi(tempX, tempY, map, ennemisIndex, EnnemiPiege));
            positionsEnnemis.push([tempX, tempY]);
            ennemisIndex++;
        }
        if(ennemis.length > niveau + 1){
            cont = false;
        }
    }
}


// ========== NIVEAU ==========

function CollecteOr(){
    score += 250;
    or += 1;
    sondOr.play();
    if(or > 5){
        map.descendreEchelle = true;
    }
}

function Gagner(){
    score += 1500;
    scorePrecedant = score;
    niveau++;
    termine.play();
    Recommencer();
}

function Detruire(x, y){
    particules.push(new Particule(x, y + 16, ticksAnimation));
    sondCreuse.play();
}

function EnnemiPiege(){
    score += 75;
}

function Meurt(){
    vies--;
    perdvie.play();
    if(vies == 0){
        GameOver();
        gameover.play();
        return;
    }
    Recommencer();
}

function GameOver(){
    ctx.font = (taille * 20).toString() + "px 'Press Start 2P'";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeStyle = "red";
    ctx.lineWidth = 3;
    ctx.fillText("GAME OVER", canvas.width * 0.5, canvas.height * 0.5);
}

function BougeDebut(){
    for(let e in ennemis){
        ennemis[e].pause = false;
    }
}


// ========== TICK ==========

function TickJoueur(){
    let tempX = 0;
    if(gauche < droite){ tempX = 1; }
    else if(gauche > droite){ tempX = -1; }
    joueur.Tick(tempX, haut, bas, tireDroite, tireGauche, map, ennemis, ticksSecondes);
}

function TickEnnemis(){
    for(let e in ennemis){
        ennemis[e].CalculerMouvement(intelligence, Math.floor(joueur.x), Math.floor(joueur.y), map, ennemis);
    }
    for(let e in ennemis){
        ennemis[e].Tick(map, ennemis);
    }
}

function Tick(){
    if(vies == 0){
        GameOver();
        return;
    }
    if(!paused)
    {
        ticksSecondes++;
        map.Tick();
        TickJoueur();
        if(!joueur.estMort){
            TickEnnemis();
        }
    }

    ticksAnimation++;
    
    Dessiner();
}


// ========== DESSINER ==========

function Dessiner(){
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, MAP_L * tailleTile, (MAP_H + 1) * tailleTile);

    // Fond
    let fond = map.GetTileTextures(0, ticksAnimation);
    for(let l in fond){
        let ligne = fond[l];
        for(let c in ligne){
            if(ligne[c]){
                ctx.drawImage(textureur.Get(ligne[c]), tailleTile * c, tailleTile * l, tailleTile, tailleTile);
            }
        }
    }

    // Joueur en vie
    if(!joueur.estMort){
        ctx.save();
        ctx.translate(joueur.GetPosXDessin(taille), joueur.GetPosYDessin(taille));
        ctx.scale(joueur.flippe, 1);
        ctx.drawImage(textureur.Get("joueur/" + joueur.texture), 0, 0, tailleTile * joueur.flippe, tailleTile);
        ctx.restore();
    }

    // Ennemis
    for(let e in ennemis){
        let en = ennemis[e];
        let enOr = "";
        if(en.tiensOr){ enOr = "_or"; }
        ctx.save();
        ctx.translate(en.GetPosXDessin(taille), en.GetPosYDessin(taille));
        ctx.scale(en.flippe, 1);
        ctx.drawImage(textureur.Get("ennemi" + enOr + "/" + en.texture), 0, 0, tailleTile * en.flippe, tailleTile);
        ctx.restore();
    }

    // Avant
    let avant = map.GetTileTextures(1, ticksAnimation);
    for(let l in avant){
        let ligne = avant[l];
        for(let c in ligne){
            if(ligne[c]){
                ctx.drawImage(textureur.Get(ligne[c]), tailleTile * c, tailleTile * l, tailleTile, tailleTile);
            }
        }
    }

    // Particules
    particules = particules.filter(p => !p.EstFini());
    for(let p in particules){
        let part = particules[p];
        part.Tick()
        ctx.drawImage(textureur.Get(part.texture), tailleTile * part.PosX(), tailleTile * part.PosY(), tailleTile, tailleTile);
    }

    // Joueur mort
    if(joueur.estMort){
        ctx.drawImage(textureur.Get("joueur/" + joueur.texture), joueur.GetPosXDessin(taille), joueur.GetPosYDessin(taille), tailleTile, tailleTile);
    }

    // Ecriture
    ctx.font = (taille * 5).toString() + "px 'Press Start 2P'";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Score: " + score.toString(), canvas.width * 0.2, canvas.height * 0.97);

    ctx.fillText("Duree: " + (ticksSecondes / 30).toFixed(1) + "s", canvas.width * 0.4, canvas.height * 0.97);

    ctx.fillText("Niveau: " + niveau.toString(), canvas.width * 0.6, canvas.height * 0.97);

    ctx.fillText("Vies: " + vies.toString(), canvas.width * 0.8, canvas.height * 0.97);

    // Debug Pathfind
    if(debogue){
        for(let e in ennemis){
            let en = ennemis[e];
            if(en.intelligence > 1){
                let chemin = ennemis[e].chemin;
                ctx.beginPath();
                ctx.moveTo((chemin[0][0] * 16 + 4 + en.index) * taille, ((MAP_H - chemin[0][1] + 1) * 16 - 1.5 - en.index) * taille);

                for(let i = 1; i < chemin.length; i++){
                    ctx.lineTo((chemin[i][0] * 16 + 4 + en.index) * taille, ((MAP_H - chemin[i][1] + 1) * 16 - 1.5 - en.index) * taille);
                }
                ctx.strokeStyle = `hsl(${en.index * 30}, 100%, 50%)`;
                ctx.lineWidth = taille;
                ctx.stroke();
            }
        }
    }
}

