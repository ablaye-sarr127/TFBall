// =========================================================================
// PARTIE 1 : CLASSES DE MODELISATION (Joueurs et Équipes)
// =========================================================================

class Player {
    constructor(name) {
        this.name = name;
        this.goals = 0;
        this.assists = 0;
        this.yellowCards = 0;
        this.redCards = 0;
    }
}

class Team {
    constructor(name, logoUrl = "") {
        this.name = name;
        this.logo = logoUrl || `https://dicebear.com{name}&backgroundColor=1d4ed8`;
        this.players = [];
        this.played = 0;
        this.won = 0;
        this.drawn = 0;
        this.lost = 0;
        this.goalsFor = 0;
        this.goalsAgainst = 0;
        this.points = 0;
        this.generateDefaultPlayers();
    }

    generateDefaultPlayers() {
        for (let i = 1; i <= 11; i++) {
            this.players.push(new Player(`Joueur ${i} (${this.name})`));
        }
    }
}
// =========================================================================
// PARTIE 2 : STRUCTURE MATCH & ETAT CENTRAL DE L'APPLICATION
// =========================================================================

class Match {
    constructor(homeTeam, awayTeam) {
        this.home = homeTeam; 
        this.away = awayTeam; 
        this.scoreHome = null;
        this.scoreAway = null;
        this.played = false;
        this.events = [];
    }
}

const App = {
    mode: null,      
    teams: [],       
    fixtures: [],    
    groups: {},       
    groupFixtures: {},
    bracket: {},      
    tournamentPhase: 'groups', 
    activeMatchData: null,
    // =========================================================================
    // PARTIE 3 : CONTROLE DES ECRANS ET VISUALISATION
    // =========================================================================

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
        document.getElementById(screenId).classList.remove('hidden');
    },

    selectMode(chosenMode) {
        this.mode = chosenMode;
        document.getElementById('setup-title').textContent = 
            chosenMode === 'championship' ? "Configuration du Championnat" : "Configuration du Tournoi";
        this.showScreen('screen-setup');
    },
    // =========================================================================
    // PARTIE 4 : INSCRIPTION ET ARCHITECTURE DES EQUIPES
    // =========================================================================

    addTeam() {
        const nameInput = document.getElementById('team-name-input');
        const logoInput = document.getElementById('team-logo-input');
        const name = nameInput.value.trim();
        const logo = logoInput.value.trim();
        
        if (!name) return;
        if (this.teams.some(t => t.name.toLowerCase() === name.toLowerCase())) {
            alert("Cette équipe existe déjà !");
            return;
        }

        this.teams.push(new Team(name, logo));
        nameInput.value = '';
        logoInput.value = '';
        this.renderSetupTeams();
    },

    renderSetupTeams() {
        const list = document.getElementById('teams-list');
        list.innerHTML = this.teams.map(t => `
            <li class="setup-team-item">
                <img src="${t.logo}" class="team-logo-small" alt="logo">
                <span>${t.name}</span>
            </li>
        `).join('');
        document.getElementById('btn-launch').disabled = this.teams.length < 4;
    },
    // =========================================================================
    // PARTIE 5 : NAVIGATION PAR ONGLETS (DASHBOARD)
    // =========================================================================

    switchTab(tabId) {
        document.querySelectorAll('.tab-link').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.add('hidden'));
        
        if (event && event.target) {
            event.target.classList.add('active');
        }
        document.getElementById(`tab-${tabId}`).classList.remove('hidden');

        if (tabId === 'stats') this.renderPlayerStats();
        if (tabId === 'media') this.generateMediaArticles();
    },

    launchCompetition() {
        const tName = document.getElementById('tournament-name-input').value.trim() || "Mon Tournoi Pro";
        const tLogo = document.getElementById('tournament-logo-input').value.trim() || "";

        document.getElementById('view-tournament-name').textContent = tName;
        const bannerLogoImg = document.getElementById('view-tournament-logo');
        if (tLogo) {
            bannerLogoImg.src = tLogo;
            bannerLogoImg.classList.remove('hidden');
        } else {
            bannerLogoImg.classList.add('hidden');
        }

        this.showScreen('screen-dashboard');
        if (this.mode === 'championship') {
            this.generateChampionship();
        } else if (this.mode === 'worldcup') {
            this.generateWorldCup();
        }
        this.saveToLocalStorage();
    },
    // =========================================================================
    // PARTIE 6 : GENERATEUR ALGORITHMIQUE DU CHAMPIONNAT (LIGA)
    // =========================================================================

    generateChampionship() {
        let pool = [...this.teams];
        if (pool.length % 2 !== 0) {
            pool.push(new Team("Exempt"));
        }

        const numTeams = pool.length;
        const totalRounds = numTeams - 1;
        const matchesPerRound = numTeams / 2;
        let allerFixtures = [];

        for (let round = 0; round < totalRounds; round++) {
            let roundMatches = [];
            for (let i = 0; i < matchesPerRound; i++) {
                const home = pool[i];
                const away = pool[numTeams - 1 - i];
                if (home.name !== "Exempt" && away.name !== "Exempt") {
                    roundMatches.push(new Match(home, away));
                }
            }
            allerFixtures.push(roundMatches);
            pool.splice(1, 0, pool.pop());
        }

        let retourFixtures = allerFixtures.map(round => {
            return round.map(match => new Match(match.away, match.home));
        });

        this.fixtures = [...allerFixtures, ...retourFixtures];
        this.renderMatchesTab();
        this.renderStandingsTab();
    },
    // =========================================================================
    // PARTIE 7 : INTERFACE ET CORE CALCUL DE LA LIGA
    // =========================================================================

    renderMatchesTab() {
        const container = document.getElementById('tab-matches');
        container.innerHTML = "";

        this.fixtures.forEach((round, roundIdx) => {
            const roundDiv = document.createElement('div');
            roundDiv.className = 'round-box';
            roundDiv.innerHTML = `<h3>Journée ${roundIdx + 1}</h3>`;

            const listDiv = document.createElement('div');
            listDiv.className = 'matches-list';

            round.forEach((match, matchIdx) => {
                const matchCard = document.createElement('div');
                matchCard.className = 'match-card';
                matchCard.innerHTML = `
                    <span class="team-name text-right">${match.home.name}</span>
                    <button class="btn-score-trigger" onclick="App.openMatchModal('championship', ${roundIdx}, ${matchIdx})">
                        ${match.played ? `${match.scoreHome} : ${match.scoreAway}` : 'Saisir Score'}
                    </button>
                    <span class="team-name text-left">${match.away.name}</span>
                `;
                listDiv.appendChild(matchCard);
            });

            roundDiv.appendChild(listDiv);
            container.appendChild(roundDiv);
        });
    },

    computeStandings() {
        this.teams.forEach(t => {
            t.played = 0; t.won = 0; t.drawn = 0; t.lost = 0;
            t.goalsFor = 0; t.goalsAgainst = 0; t.points = 0;
        });

        this.fixtures.flat().forEach(match => {
            if (!match.played) return;
            const h = match.home; const a = match.away;
            h.played++; a.played++;
            h.goalsFor += match.scoreHome; h.goalsAgainst += match.scoreAway;
            a.goalsFor += match.scoreAway; a.goalsAgainst += match.scoreHome;

            if (match.scoreHome > match.scoreAway) { h.won++; h.points += 3; a.lost++; }
            else if (match.scoreHome < match.scoreAway) { a.won++; a.points += 3; h.lost++; }
            else { h.drawn++; h.points += 1; a.drawn++; a.points += 1; }
        });

        this.teams.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            const diffA = a.goalsFor - a.goalsAgainst;
            const diffB = b.goalsFor - b.goalsAgainst;
            if (diffB !== diffA) return diffB - diffA;
            return b.goalsFor - a.goalsFor;
        });
        this.renderStandingsTab();
    },
    // =========================================================================
    // PARTIE 8 : TABLEAU GRAPHIQUE DU CLASSEMENT GENERAL
    // =========================================================================

    renderStandingsTab() {
        const container = document.getElementById('tab-standings');
        container.innerHTML = `
            <table class="standings-table">
                <thead>
                    <tr><th>Pos</th><th class="text-left">Équipe</th><th>MJ</th><th>G</th><th>N</th><th>P</th><th>BP</th><th>BC</th><th>DB</th><th>Pts</th></tr>
                </thead>
                <tbody>
                    ${this.teams.map((t, idx) => {
                        const db = t.goalsFor - t.goalsAgainst;
                        return `
                            <tr>
                                <td><strong>${idx + 1}</strong></td>
                                <td class="text-left team-cell-logo">
                                    <img src="${t.logo}" class="team-logo-table" alt="logo">
                                    <strong>${t.name}</strong>
                                </td>
                                <td>${t.played}</td><td>${t.won}</td><td>${t.drawn}</td><td>${t.lost}</td>
                                <td>${t.goalsFor}</td><td>${t.goalsAgainst}</td>
                                <td>${db > 0 ? '+' + db : db}</td>
                                <td><span class="pts-badge">${t.points}</span></td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    },
    // =========================================================================
    // PARTIE 9 : REPARTITION ET LOGIQUE DES POULES (TOURNOI)
    // =========================================================================

    generateWorldCup() {
        this.tournamentPhase = 'groups';
        this.groups = {};
        this.groupFixtures = {};
        let shuffled = [...this.teams].sort(() => Math.random() - 0.5);
        const teamsPerGroup = 4;
        const numGroups = Math.ceil(shuffled.length / teamsPerGroup);
        
        for (let i = 0; i < numGroups; i++) {
            const groupLetter = String.fromCharCode(65 + i);
            this.groups[groupLetter] = shuffled.slice(i * teamsPerGroup, (i + 1) * teamsPerGroup);
            this.generateGroupFixtures(groupLetter);
        }
        document.getElementById('tab-link-bracket').style.display = 'none';
        this.renderGroupsTab();
    },

    generateGroupFixtures(groupLetter) {
        let pool = [...this.groups[groupLetter]];
        if (pool.length % 2 !== 0) pool.push(new Team("Exempt"));
        const numTeams = pool.length;
        const rounds = numTeams - 1;

        this.groupFixtures[groupLetter] = [];
        for (let r = 0; r < rounds; r++) {
            for (let i = 0; i < numTeams / 2; i++) {
                const home = pool[i]; const away = pool[numTeams - 1 - i];
                if (home.name !== "Exempt" && away.name !== "Exempt") {
                    this.groupFixtures[groupLetter].push(new Match(home, away));
                }
            }
            pool.splice(1, 0, pool.pop());
        }
    },
    // =========================================================================
    // PARTIE 10 : INTERFACE DE LA PHASE DE GROUPES DYNAMIQUE
    // =========================================================================

    renderGroupsTab() {
        const container = document.getElementById('tab-matches');
        container.innerHTML = `<h2 class="phase-title">🏆 Phase de Groupes</h2>`;

        Object.keys(this.groups).forEach(groupLetter => {
            const groupSection = document.createElement('div');
            groupSection.className = 'group-section';
            this.computeGroupStandings(groupLetter);

            groupSection.innerHTML = `
                <div class="group-header">Groupe ${groupLetter}</div>
                <div class="group-body">
                    <div class="group-table-side">
                        <table class="standings-table compact">
                            <thead><tr><th>Pos</th><th class="text-left">Équipe</th><th>Pts</th><th>DB</th></tr></thead>
                            <tbody>
                                ${this.groups[groupLetter].map((t, idx) => `
                                    <tr class="${idx < 2 ? 'qualified-row' : ''}">
                                        <td>${idx + 1}</td><td class="text-left">${t.name}</td>
                                        <td><strong>${t.points}</strong></td><td>${t.goalsFor - t.goalsAgainst}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    <div class="group-matches-side">
                        <div class="matches-list">
                            ${this.groupFixtures[groupLetter].map((match, mIdx) => `
                                <div class="match-card compact-card">
                                    <span class="team-name text-right">${match.home.name}</span>
                                    <button class="btn-score-trigger compact-btn" onclick="App.openMatchModal('worldcup', '${groupLetter}', ${mIdx})">
                                        ${match.played ? `${match.scoreHome} : ${match.scoreAway}` : 'Score'}
                                    </button>
                                    <span class="team-name text-left">${match.away.name}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(groupSection);
        });
        this.checkGroupPhaseCompletion();
    },

    computeGroupStandings(groupLetter) {
        this.groups[groupLetter].forEach(t => { t.points = 0; t.goalsFor = 0; t.goalsAgainst = 0; });
        this.groupFixtures[groupLetter].forEach(match => {
            if (!match.played) return;
            const h = match.home; const a = match.away;
            h.goalsFor += match.scoreHome; h.goalsAgainst += match.scoreAway;
            a.goalsFor += match.scoreAway; a.goalsAgainst += match.scoreHome;

            if (match.scoreHome > match.scoreAway) h.points += 3;
            else if (match.scoreHome < match.scoreAway) a.points += 3;
            else { h.points += 1; a.points += 1; }
        });

        this.groups[groupLetter].sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            return (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst);
        });
    },

    checkGroupPhaseCompletion() {
        let allPlayed = true;
        Object.values(this.groupFixtures).flat().forEach(m => { if (!m.played) allPlayed = false; });

        if (allPlayed && Object.keys(this.groups).length >= 2) {
            const container = document.getElementById('tab-matches');
            const btn = document.createElement('button');
            btn.className = 'btn-main';
            btn.innerHTML = "Générer la Phase Finale (Arbre) 🏆";
            btn.onclick = () => App.generateKnockoutBracket();
            container.appendChild(btn);
        }
    },
    // =========================================================================
    // PARTIE 11 : ALGORITHME DE L'ARBRE FINAL (ELIMINATION DIRECTE)
    // =========================================================================

    generateKnockoutBracket() {
        this.tournamentPhase = 'knockout';
        let qualified = [];
        Object.keys(this.groups).sort().forEach(letter => {
            if(this.groups[letter][0]) qualified.push(this.groups[letter][0]);
            if(this.groups[letter][1]) qualified.push(this.groups[letter][1]);
        });

        if(qualified.length < 4) {
            alert("Pas assez d'équipes qualifiées pour générer des demi-finales.");
            return;
        }

        this.bracket = {
            demis: [
                new Match(qualified[0], qualified[3] || new Team("À Déterminer")),
                new Match(qualified[2] || new Team("À Déterminer"), qualified[1])
            ],
            finale: [
                new Match(new Team("À Déterminer"), new Team("À Déterminer"))
            ]
        };

        document.getElementById('tab-link-bracket').style.display = 'block';
        this.switchTab('bracket');
        this.renderBracket();
    },

    renderBracket() {
        const container = document.getElementById('bracket-container');
        container.innerHTML = `
            <div class="bracket-column">
                <h3>Demi-finales</h3>
                ${this.bracket.demis.map((match, idx) => this.getBracketMatchHTML('demis', idx, match)).join('')}
            </div>
            <div class="bracket-column">
                <h3>Finale</h3>
                ${this.bracket.finale.map((match, idx) => this.getBracketMatchHTML('finale', idx, match)).join('')}
            </div>
        `;
    },

    getBracketMatchHTML(phase, idx, match) {
        const disabled = (match.home.name.includes("À Déterminer") || match.away.name.includes("À Déterminer")) ? 'disabled' : '';
        return `
            <div class="match-card bracket-card">
                <div class="bracket-team">
                    <span>${match.home.name}</span>
                    <input type="number" ${disabled} value="${match.scoreHome !== null ? match.scoreHome : ''}" 
                        oninput="App.updateBracketScore('${phase}', ${idx}, 'home', this.value)">
                </div>
                <div class="bracket-team">
                    <span>${match.away.name}</span>
                    <input type="number" ${disabled} value="${match.scoreAway !== null ? match.scoreAway : ''}" 
                        oninput="App.updateBracketScore('${phase}', ${idx}, 'away', this.value)">
                </div>
            </div>
        `;
    },

    updateBracketScore(phase, idx, side, value) {
        const match = this.bracket[phase][idx];
        const val = value === "" ? null : parseInt(value);

        if (side === 'home') match.scoreHome = val;
        if (side === 'away') match.scoreAway = val;

        if (match.scoreHome !== null && match.scoreAway !== null) {
            if (match.scoreHome === match.scoreAway) {
                alert("Match éliminatoire : Pas de match nul possible (Simulez des tirs au but) !");
                return;
            }
            match.played = true;
            const winner = match.scoreHome > match.scoreAway ? match.home : match.away;

            if (phase === 'demis') {
                if (idx === 0) this.bracket.finale[0].home = winner;
                if (idx === 1) this.bracket.finale[0].away = winner;
            } else if (phase === 'finale') {
                alert(`🎉 LE CHAMPION DU TOURNOI EST : ${winner.name} !!! 🎉`);
            }
            this.saveToLocalStorage();
        }
        this.renderBracket();
    },
    // =========================================================================
    // PARTIE 12 : INTERACTION DE LA MODALE & FEUILLE DE MATCH
    // =========================================================================

    openMatchModal(type, firstIndex, secondIndex) {
        let match;
        if (type === 'championship') {
            match = this.fixtures[firstIndex][secondIndex];
            this.activeMatchData = { type, round: firstIndex, match: secondIndex };
        } else {
            match = this.groupFixtures[firstIndex][secondIndex];
            this.activeMatchData = { type, group: firstIndex, match: secondIndex };
        }

        document.getElementById('modal-home-name').textContent = match.home.name;
        document.getElementById('modal-away-name').textContent = match.away.name;
        document.getElementById('modal-score-home').value = match.scoreHome !== null ? match.scoreHome : '';
        document.getElementById('modal-score-away').value = match.scoreAway !== null ? match.scoreAway : '';
        document.getElementById('modal-events-selectors').innerHTML = "";
        
        if(match.played) this.generateEventsForm();
        document.getElementById('match-modal').classList.remove('hidden');
    },

    closeModal() {
        document.getElementById('match-modal').classList.add('hidden');
        this.activeMatchData = null;
    },

    generateEventsForm() {
        const scoreHome = parseInt(document.getElementById('modal-score-home').value) || 0;
        const scoreAway = parseInt(document.getElementById('modal-score-away').value) || 0;
        
        let match = this.activeMatchData.type === 'championship' 
            ? this.fixtures[this.activeMatchData.round][this.activeMatchData.match]
            : this.groupFixtures[this.activeMatchData.group][this.activeMatchData.match];

        const container = document.getElementById('modal-events-selectors');
        container.innerHTML = "<h4>Détails des Actions</h4>";

        if (scoreHome > 0) {
            container.innerHTML += `<h5>Buteurs : ${match.home.name}</h5>`;
            for (let i = 0; i < scoreHome; i++) container.appendChild(this.createEventRowHTML(match.home, 'home', i));
        }
        if (scoreAway > 0) {
            container.innerHTML += `<h5>Buteurs : ${match.away.name}</h5>`;
            for (let i = 0; i < scoreAway; i++) container.appendChild(this.createEventRowHTML(match.away, 'away', i));
        }
    },

    createEventRowHTML(team, side, goalIndex) {
        const row = document.createElement('div');
        row.className = 'modal-event-row';
        const scorerOptions = team.players.map(p => `<option value="${p.name}">🏃 ${p.name}</option>`).join('');
        const assistantOptions = `<option value="">Pas de passeur</option>` + team.players.map(p => `<option value="${p.name}">... ${p.name}</option>`).join('');

        row.innerHTML = `
            <span>But n°${goalIndex + 1} :</span>
            <select class="sc-select" data-side="${side}" data-type="scorer">${scorerOptions}</select>
            <select class="as-select" data-side="${side}" data-type="assistant">${assistantOptions}</select>
            <div class="cards-checkboxes">
                <label><input type="checkbox" class="yc-check" data-side="${side}"> 🟨</label>
                <label><input type="checkbox" class="rc-check" data-side="${side}"> 🟥</label>
            </div>
        `;
        return row;
    },

    saveMatchEvents() {
        const scoreHomeInput = document.getElementById('modal-score-home').value;
        const scoreAwayInput = document.getElementById('modal-score-away').value;

        if (scoreHomeInput === "" || scoreAwayInput === "") {
            alert("Saisissez un score."); return;
        }

        let match = this.activeMatchData.type === 'championship' 
            ? this.fixtures[this.activeMatchData.round][this.activeMatchData.match]
            : this.groupFixtures[this.activeMatchData.group][this.activeMatchData.match];

        if (match.played) this.removeMatchStatsFromPlayers(match);

        match.scoreHome = parseInt(scoreHomeInput);
        match.scoreAway = parseInt(scoreAwayInput);
        match.played = true;
        match.events = [];

        document.querySelectorAll('.modal-event-row').forEach(row => {
            const side = row.querySelector('[data-type="scorer"]').dataset.side;
            const scorerName = row.querySelector('[data-type="scorer"]').value;
            const assistantName = row.querySelector('[data-type="assistant"]').value;
            const hasYellow = row.querySelector('.yc-check').checked;
            const hasRed = row.querySelector('.rc-check').checked;
            const team = side === 'home' ? match.home : match.away;
            
            const scorerObj = team.players.find(p => p.name === scorerName);
            if (scorerObj) {
                scorerObj.goals++;
                if (hasYellow) scorerObj.yellowCards++;
                if (hasRed) scorerObj.redCards++;
            }

            if (assistantName) {
                const assistantObj = team.players.find(p => p.name === assistantName);
                if (assistantObj) assistantObj.assists++;
            }
            match.events.push({ scorer: scorerName, assistant: assistantName, side: side, yellow: hasYellow, red: hasRed });
        });

        if (this.activeMatchData.type === 'championship') {
            this.computeStandings(); this.renderMatchesTab();
        } else {
            this.renderGroupsTab();
        }

        this.saveToLocalStorage();
        this.closeModal();
    },

    removeMatchStatsFromPlayers(oldMatch) {
        oldMatch.events.forEach(ev => {
            const team = ev.side === 'home' ? oldMatch.home : oldMatch.away;
            const scorer = team.players.find(p => p.name === ev.scorer);
            if (scorer) {
                scorer.goals--;
                if (ev.yellow) scorer.yellowCards--;
                if (ev.red) scorer.redCards--;
            }
            if (ev.assistant) {
                const assistant = team.players.find(p => p.name === ev.assistant);
                if (assistant) assistant.assists--;
            }
        });
    },

    renderPlayerStats() {
        let allPlayers = this.teams.flatMap(t => t.players);
        let topScorers = [...allPlayers].filter(p => p.goals > 0).sort((a, b) => b.goals - a.goals).slice(0, 10);
        let topAssists = [...allPlayers].filter(p => p.assists > 0).sort((a, b) => b.assists - a.assists).slice(0, 10);

        document.getElementById('scorers-list').innerHTML = topScorers.length ? topScorers.map((p, idx) => `
            <li><span class="rank-badge">${idx + 1}</span> <strong>${p.name}</strong> <span class="stat-count">${p.goals} Buts</span></li>
        `).join('') : "<p class='placeholder-text'>Aucun but.</p>";

        document.getElementById('assists-list').innerHTML = topAssists.length ? topAssists.map((p, idx) => `
            <li><span class="rank-badge civil">${idx + 1}</span> <strong>${p.name}</strong> <span class="stat-count assist">${p.assists} Passes</span></li>
        `).join('') : "<p class='placeholder-text'>Aucune passe.</p>";
    },
    // =========================================================================
    // PARTIE 13 : JOURNALISME MEDIA, SAUVEGARDE CLOUD & FIN DE L'OBJET
    // =========================================================================

    generateMediaArticles() {
        const feed = document.getElementById('media-feed');
        feed.innerHTML = "";
        let playedMatches = [];

        if (this.mode === 'championship') {
            playedMatches = this.fixtures.flat().filter(m => m.played);
        } else {
            playedMatches = Object.values(this.groupFixtures).flat().filter(m => m.played);
            if (this.bracket && this.bracket.demis) playedMatches.push(...this.bracket.demis.filter(m => m.played));
            if (this.bracket && this.bracket.finale) playedMatches.push(...this.bracket.finale.filter(m => m.played));
        }

        if (playedMatches.length === 0) {
            feed.innerHTML = "<p class='placeholder-text'>Jouez des matchs pour remplir les journaux !</p>";
            return;
        }

        [...playedMatches].reverse().slice(0, 5).forEach(match => {
            const article = document.createElement('div');
            article.className = 'media-card-article';
            let title = ""; let body = "";
                const scorerText = match.events.length > 0 
                ? `grâce à des réalisations de ${[...new Set(match.events.map(e => e.scorer))].join(', ')}` 
                : "au terme d'une rencontre très fermée";

            if (match.scoreHome === match.scoreAway) {
                if (match.scoreHome === 0) {
                    title = `⚽ Ennui mortel entre ${match.home.name} et ${match.away.name}`;
                    body = `Les spectateurs ont assisté à un bien triste spectacle aujourd'hui. Score final 0-0. Un manque d'ambition flagrant offensivement.`;
                } else {
                    title = `🔥 Parité spectaculaire entre ${match.home.name} et ${match.away.name} (${match.scoreHome}-${match.scoreAway})`;
                    body = `Quel match ! Aucune des deux équipes n'a voulu céder. Un nul logique ${scorerText}. Les attaquants ont régalé le public.`;
                }
            } else {
                const winner = match.scoreHome > match.scoreAway ? match.home.name : match.away.name;
                const loser = match.scoreHome > match.scoreAway ? match.away.name : match.home.name;
                const scoreWinner = Math.max(match.scoreHome, match.scoreAway);
                const scoreLoser = Math.min(match.scoreHome, match.scoreAway);
                
                if ((scoreWinner - scoreLoser) >= 3) {
                    title = `🚨 DÉMONSTRATION ! ${winner} écrase totalement ${loser} !`;
                    body = `Il n'y a pas eu de match. ${winner} a surclassé son adversaire sur le score sans appel de ${scoreWinner} à ${scoreLoser} ${scorerText}.`;
                } else {
                    title = `💼 Victoire précieuse pour ${winner} face à ${loser}`;
                    body = `Dans un match à haute tension tactique, ${winner} s'impose sur la plus petite des marges (${scoreWinner}-${scoreLoser}) ${scorerText}.`;
                }
            }

            article.innerHTML = `<div class="media-badge">FLASH INFO</div><h3>${title}</h3><p>${body}</p><div class="media-footer-text">✍️ Rédaction sportive</div>`;
            feed.appendChild(article);
        });
    },

    async saveToLocalStorage() {
        if (!window.Auth || !window.Auth.currentUser) return;

        const tName = document.getElementById('tournament-name-input').value.trim() || "Mon Tournoi Pro";
        const tLogo = document.getElementById('tournament-logo-input').value.trim() || "";

        const dataToSave = {
            tournamentName: tName,
            tournamentLogo: tLogo,
            mode: this.mode, 
            teams: JSON.parse(JSON.stringify(this.teams)), 
            fixtures: JSON.parse(JSON.stringify(this.fixtures)),
            groups: JSON.parse(JSON.stringify(this.groups)), 
            groupFixtures: JSON.parse(JSON.stringify(this.groupFixtures)),
            bracket: JSON.parse(JSON.stringify(this.bracket)), 
            tournamentPhase: this.tournamentPhase
        };

        try {
            const userDocRef = window.fbDoc(window.fbDb, "tournaments", window.Auth.currentUser.uid);
            await window.fbSetDoc(userDocRef, dataToSave);
            console.log("Données du tournoi synchronisées dans le Cloud !");
        } catch (e) {
            console.error("Échec de la sauvegarde sur Firebase :", e);
        }
    },

    async loadFromFirebase(userId) {
        try {
            const userDocRef = window.fbDoc(window.fbDb, "tournaments", userId);
            const docSnap = await window.fbGetDoc(userDocRef);

            if (!docSnap.exists()) {
                this.showScreen('screen-mode');
                return;
            }

            const data = docSnap.data();
            this.mode = data.mode; 
            this.teams = data.teams; 
            this.fixtures = data.fixtures;
            this.groups = data.groups; 
            this.groupFixtures = data.groupFixtures;
            this.bracket = data.bracket; 
            this.tournamentPhase = data.tournamentPhase;

            document.getElementById('tournament-name-input').value = data.tournamentName || "";
            document.getElementById('tournament-logo-input').value = data.tournamentLogo || "";
            document.getElementById('view-tournament-name').textContent = data.tournamentName || "Mon Tournoi";
            
            const bannerLogoImg = document.getElementById('view-tournament-logo');
            if (data.tournamentLogo) {
                bannerLogoImg.src = data.tournamentLogo;
                bannerLogoImg.classList.remove('hidden');
            } else {
                bannerLogoImg.classList.add('hidden');
            }

            this.showScreen('screen-dashboard');
            if (this.mode === 'worldcup' && this.tournamentPhase === 'knockout') {
                document.getElementById('tab-link-bracket').style.display = 'block';
            }

            if (this.mode === 'championship') {
                this.computeStandings(); 
                this.renderMatchesTab();
            } else {
                if (this.tournamentPhase === 'groups') this.renderGroupsTab();
                else this.renderBracket();
            }
        } catch (e) {
            console.error("Erreur de récupération Firebase :", e);
            this.showScreen('screen-mode');
        }
    },

    async resetApplication() {
        if (confirm("Supprimer définitivement ce tournoi du Cloud ?")) {
            try {
                const userDocRef = window.fbDoc(window.fbDb, "tournaments", window.Auth.currentUser.uid);
                await window.fbSetDoc(userDocRef, {});
                window.location.reload();
            } catch (e) {
                alert("Erreur lors de la réinitialisation.");
            }
        }
    }
}; // <-- CETTE ACCOLADE ULTRA-IMPORTANTE FERME ENFIN L'OBJET APP ET LE FICHIER JS

