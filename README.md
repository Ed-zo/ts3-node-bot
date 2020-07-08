# ts3-node-bot
Tento bot sa sklada z dvoch casti. Klient a server. Klient prijima spravy na TS3 serveri a tieto spravy su preposlane serveru, ktory sa uz postara o vykonanie vsetkych potrebnych akcii. Aby bol skutocny klient zobrazeny na serveri, je klientska cast plugin do TeamSpeak 3 Klienta!

## Konfiguracia
### Klient
1. Pre spravnu konfiguraciu treba nainstalovat oficialny Lua plugin. 
2. Obsah zlozky client (`init.lua`, `sender.lua`, `events.lua`, `json.lua`) presunut do novej TeamSpeaku zlozky `teamspeak/plugins/lua_plugin/tsbot`. (Je dolezite aby koncovy folder sa volal tsbot)
3. Nastavit v `init.lua` spravnu URL na HTTP server
4. Po spusteni TeamSpeak klienta je treba vytvorit bookmark s autoconnect na server. Staci nastavit iba IP a autoconnect, klient sa po pripojeni na server uz automaticky premenuje aj premiestni do svojej miestnosti

### Server
1. Premenovat `.env.example` na `.env` a spravne nakonfigurovat
2. Extra nastavenia su v `src/config.js`
