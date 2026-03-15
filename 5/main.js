/*
 * © 2026 Nicholas (Jasper) Birla-Eliade
 * Tous droits réservés.
 *
 * Ce code et son contenu sont la propriété exclusive de Nicholas Birla-Eliade, aka Nick Jasper.
 * Aucune partie de ce code ne peut être reproduite, modifié, distribuée ou utilisée sans autorisation écrite préalable.
 */

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

// ========== SONS ==========

function ChargeSons(array, compte, chemin, extension){
    for(let i = 0; i < compte; i++){ 
        array.push(new Audio(chemin + i.toString() + extension));
        sonsTotales++;
        array[i].addEventListener("canplaythrough", () => { sonsCharges++; });
    }
}

let sonsCharges = 0;
let sonsTotales = 9;

const sonProchain = new Audio("sons/prochain.wav");
sonProchain.addEventListener("canplaythrough", () => { sonsCharges++; });
const sonPerdu = new Audio("sons/perdu.mp3");
sonPerdu.addEventListener("canplaythrough", () => { sonsCharges++; });
const sonGagne = new Audio("sons/gagne.mp3");
sonPerdu.addEventListener("canplaythrough", () => { sonsCharges++; });

// Or
const sonsOr = [];
ChargeSons(sonsOr, 4, "sons/or/or", ".mp3");
let sonsOrPrecedants = [];

function JouerSonOr(flippe){
    let index = GetRandomInt(0, 3);
    while(sonsOrPrecedants.includes(index)){ index = GetRandomInt(0, 3); }
    sonsOrPrecedants.push(index);
    if(sonsOrPrecedants.length > 2){ sonsOrPrecedants.shift(); }
    sonsOr[index].play();
}

// Detruit

const sonsBrise = [];
ChargeSons(sonsBrise, 7, "sons/detruit/", ".mp3");
let sonsBrisePrecedants = [];

function JouerSonDetruit(){
    let brise = GetRandomInt(0, 6);
    while(sonsBrisePrecedants.includes(brise)){ brise = GetRandomInt(0, 6); }
    sonsBrisePrecedants.push(brise);
    if(sonsBrisePrecedants.length > 3){ sonsBrisePrecedants.shift(); }

    sonsBrise[brise].play();
}

// Ennemi Meurt

const sonsMeurt = [];
ChargeSons(sonsMeurt, 6, "sons/mort/", ".mp3");
let sonsMeurtPrecedants = [];

function JouerSonEnnemiMeurt(){
    let meurt = GetRandomInt(0, 5);
    while(sonsMeurtPrecedants.includes(meurt)){ meurt = GetRandomInt(0, 5); }
    sonsMeurtPrecedants.push(meurt);
    if(sonsMeurtPrecedants.length > 3){ sonsMeurtPrecedants.shift(); }

    sonsMeurt[meurt].play();
}

// Ennemi Piege

const sonsPiege = [];
ChargeSons(sonsPiege, 4, "sons/piege/", ".wav");
let sonsPiegePrecedants = [];

function JouerSonEnnemiPiege(){
    let piege = GetRandomInt(0, 3);
    while(sonsPiegePrecedants.includes(piege)){ piege = GetRandomInt(0, 3); }
    sonsPiegePrecedants.push(piege);
    if(sonsPiegePrecedants.length > 2){ sonsPiegePrecedants.shift(); }

    sonsPiege[piege].play();
}


// ========== INPUT ==========

let haut = false;
let bas = false;
let gauche = 0;
let droite = 0;
let tireGauche = false;
let tireDroite = false;

window.addEventListener("keydown", (event) => {
    switch(event.key){
        case "ArrowUp": haut = true; event.preventDefault(); break;
        case "ArrowDown": bas = true; event.preventDefault(); break;
        case "ArrowLeft": gauche++; event.preventDefault(); break;
        case "ArrowRight": droite++; event.preventDefault(); break;
        case "z": tireGauche = true; break;
        case "x": tireDroite = true; break;
        case " ": if(gameOver || gagne) Debuter(); event.preventDefault(); break;
        case "p": Prochain(); break;
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


// ========== IMPORTER JEU ==========

let mapsTotales = [];
let revientTotales = [];
let echellesTotales = [];

const importeJeu = document.getElementById("fichierImporte");

importeJeu.addEventListener("change", (event) =>{
    const file = event.target.files[0];
    if(!file){ return; }

    const reader = new FileReader();

    reader.onload = function(e) {
        mapsTotales = [];
        revientTotales = [];
        echellesTotales = [];

        const content = e.target.result.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        
        let lines = content.split('\n');
        for(let i = 0; Math.floor(lines.length / 35); i++){
            echellesTotales.push(Number(lines.shift()));
            let stringMap = "";
            let stringRevient = "";
            for(let j = 1; j < 18; j++){
                stringMap += lines.shift() + "\n";
            }
            for(let j = 1; j < 18; j++){
                stringRevient += lines.shift() + "\n";
            }
            mapsTotales.push(stringMap);
            revientTotales.push(stringRevient);
        }
        Debuter();
    }

    reader.readAsText(file);
    
});


// ========== GAME STATE ==========

let ticksJeu = 0;
let ticksDuree = 0;
let ticksAnimation = 0;
let ticksChargement = 0;
let paused = true;
let gameOver = false;
let gagne = false;
let joueur;
let map;

let or = 0;
let orMax = 6;
let score = 0;
let niveau = 1;
let scorePrecedant = 0;

let particules = [];
let ennemis = [];
let positionsEnnemis = [];


// ========== DEBUTER ==========

textureur = new Textureur(Debuter);

intervalId = setInterval(Tick,1000/vitesse);

function Debuter(){
    or = 0;
    score = 0;
    niveau = 1;
    scorePrecedant = 0;
    particules = [];
    pause = false;
    gagne = false;
    gameOver = false;
    vies = 5;
    Recommencer();
}

function Recommencer(){
    ticksJeu = 0;
    ticksDuree = 0;
    ticksAnimation = 0;
    score = scorePrecedant;
    paused = true;
    or = 0;
    ResetInterval();
    
    if(mapsTotales.length == 0){
        map = new Map("", "", 18, SonCharge, SonAjoute, PlacerCharacteres);
        joueur = new Joueur(MAP_L * 8 - 8, 3 * 16, Meurt, CollecteOr, Prochain, Detruire, BougeDebut, SonCharge, SonAjoute);
        orMax = 6;
    }
    else{
        if(niveau > mapsTotales.length){
            Gagne();
        }
        else{
            map = new Map(mapsTotales[niveau - 1], revientTotales[niveau - 1], echellesTotales[niveau - 1], SonCharge, SonAjoute, PlacerCharacteres);
            return;
        }
    }

    ennemis = [];
    positionsEnnemis = [];
    let ennemisIndex = 0;
    let tempX;
    let tempY;
    let cont = true;
    let loops = 0;

    while(cont){
        tempX = Math.floor(GetRandomInt(0, MAP_L) * 16);
        tempY = Math.floor(GetRandomInt(4, MAP_H) * 16);
        if(map.EstAir(tempX, tempY) && map.EstFermeInnocupe(tempX, tempY - 16) && !positionsEnnemis.some(p => p[0] === tempX && p[1] === tempY)){
            ennemis.push(new Ennemi(tempX, tempY, map, ennemisIndex, EnnemiPiege, EnnemiMeurt));
            positionsEnnemis.push([tempX, tempY]);
            ennemisIndex++;
        }
        if(ennemis.length > niveau + 1){
            cont = false;
        }
        loops++;
        if(loops > 10000){
            cont = false;
            Debuter();
        }
    }
}

function PlacerCharacteres(characteres, or){
    joueur = new Joueur(characteres[0][0] * 16, characteres[0][1] * 16, Meurt, CollecteOr, Prochain, Detruire, BougeDebut, SonCharge, SonAjoute);
    ennemis = [];
    for(let i = 1; i < characteres.length; i++){
        ennemis.push(new Ennemi(characteres[i][0] * 16, characteres[i][1] * 16, map, i - 1, EnnemiPiege, EnnemiMeurt));
    }
    orMax = or;
}


// ========== NIVEAU ==========

function CollecteOr(){
    score += 250;
    or += 1;
    JouerSonOr();
    if(or >= orMax){
        map.descendreEchelle = true;
    }
}

function Prochain(){
    score += 1500;
    scorePrecedant = score;
    niveau++;
    sonProchain.play();
    Recommencer();
}

function Detruire(x, y){
    particules.push(new Particule(x, y + 16, ticksAnimation));
    JouerSonDetruit();
}

function EnnemiPiege(){
    score += 75;
    JouerSonEnnemiPiege();
}

function EnnemiMeurt(){
    score += 75;
    JouerSonEnnemiMeurt();
}

function Meurt(){
    vies--;
    if(vies == 0){
        GameOver();
        sonPerdu.play();
        return;
    }
    Recommencer();
}

function GameOver(){
    paused = true;
    gameOver = true;
}

function Gagne(){
    paused = true;
    gagne = true;
    sonGagne.play();
}

function BougeDebut(){
    paused = false;
}

function SonAjoute(){
    sonsTotales++;
}

function SonCharge(){
    sonsCharges++;
}


// ========== TICK ==========

function TickJoueur(){
    let tempX = 0;
    if(gauche < droite){ tempX = 1; }
    else if(gauche > droite){ tempX = -1; }
    joueur.Tick(tempX, haut, bas, tireDroite, tireGauche, map, ennemis, ticksJeu);
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
    if(vies < 1){
        GameOver();
        Dessiner();
        return;
    }

    ticksChargement++;
    if(sonsCharges >= sonsTotales){
        TickJoueur();
        ticksJeu++;
    }
    else{
        // Chargement des sons
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, MAP_L * tailleTile, (MAP_H + 1) * tailleTile);
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = (taille * 10).toString() + "px 'Press Start 2P'";
        ctx.fillText("CHARGEMENT DES SONS", canvas.width * 0.5, canvas.height * 0.4);
        ctx.font = (taille * 4).toString() + "px 'Press Start 2P'";
        ctx.fillText(sonsCharges.toString() + "/" + sonsTotales.toString(), canvas.width * 0.5, canvas.height * 0.6);
        return;
    }

    if(!paused)
    {
        ticksDuree++;
        map.Tick();
        if(!joueur.estMort){
            TickEnnemis();
        }
        ticksAnimation++;
    }

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
        let enOr = en.compteOr.toString();
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

    ctx.fillText("Duree: " + (ticksDuree / 30).toFixed(1) + "s", canvas.width * 0.4, canvas.height * 0.97);

    ctx.fillText("Niveau: " + niveau.toString(), canvas.width * 0.6, canvas.height * 0.97);

    ctx.fillText("Vies: " + vies.toString(), canvas.width * 0.8, canvas.height * 0.97);

    // Debug Pathfind
    if(debogue){
        for(let e in ennemis){
            let en = ennemis[e];
            if(en.dessinerLigneDebug){
                let chemin = ennemis[e].chemin;
                ctx.beginPath();
                ctx.moveTo((chemin[0][0] * 16 + 4 + en.index) * taille, ((MAP_H - chemin[0][1] + 1) * 16 - 1.5 - en.index) * taille);

                for(let i = 1; i < chemin.length; i++){
                    ctx.lineTo((chemin[i][0] * 16 + 4 + en.index) * taille, ((MAP_H - chemin[i][1] + 1) * 16 - 1.5 - en.index) * taille);
                }
                ctx.strokeStyle = `hsl(${en.index * 40}, 100%, 50%)`;
                ctx.lineWidth = taille;
                ctx.stroke();
            }
        }
    }

    if(gameOver){
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.strokeStyle = "red";
        ctx.lineWidth = 3;
        ctx.font = (taille * 20).toString() + "px 'Press Start 2P'";
        ctx.fillText("GAME OVER", canvas.width * 0.5, canvas.height * 0.45);
        ctx.font = (taille * 10).toString() + "px 'Press Start 2P'";
        ctx.fillText('Appuyer sur "Espace" pour recommencer.', canvas.width * 0.5, canvas.height * 0.55);
    }
    else if(gagne){
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.strokeStyle = "red";
        ctx.lineWidth = 3;
        ctx.font = (taille * 20).toString() + "px 'Press Start 2P'";
        ctx.fillText("GAME COMPLET", canvas.width * 0.5, canvas.height * 0.45);
        ctx.font = (taille * 10).toString() + "px 'Press Start 2P'";
        ctx.fillText('Appuyer sur "Espace" pour recommencer.', canvas.width * 0.5, canvas.height * 0.55);
    }
}

