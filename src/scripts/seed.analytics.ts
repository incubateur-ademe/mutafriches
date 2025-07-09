import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AnalyticsService } from '../services/analytics.service';
import {
  ActionTypes,
  type Integrator,
} from '../database/analytics/analytics.types';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const analyticsService = app.get(AnalyticsService);

  console.log("Début du seed des métriques d'impact...");

  try {
    // Nettoyer les données existantes
    await analyticsService.clearAllData();
    console.log('Données existantes supprimées');

    // 1. Création d'intégrateurs fictifs
    const integrators = [
      { name: 'Bénéfriches', domain: 'benefriches.beta.gouv.fr' },
      { name: 'UrbanVitaliz', domain: 'urbanvitaliz.beta.gouv.fr' },
      {
        name: 'Collectivité de Nantes Métropole',
        domain: 'nantesmetropole.fr',
      },
    ];

    const createdIntegrators: Integrator[] = [];
    for (const integrator of integrators) {
      const [created] = await analyticsService.createIntegrator(integrator);
      if (created) {
        createdIntegrators.push(created);
        console.log(`Intégrateur créé: ${created.name}`);
      }
    }

    // 2. Génération de données sur une période d'1 semaine
    const startDate = new Date('2025-07-01');
    const endDate = new Date('2025-07-08');
    const totalDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    let totalSessions = 0;
    let completedSessions = 0;
    let detailsClicked = 0;
    let contactClicked = 0;
    let toolLinkClicked = 0;

    // Générer 10-30 sessions par jour
    for (let day = 0; day < totalDays; day++) {
      const currentDate = new Date(
        startDate.getTime() + day * 24 * 60 * 60 * 1000,
      );

      // Variation selon le jour de la semaine
      const dayOfWeek = currentDate.getDay();
      let baseSessions = 20; // Base réduite
      if (dayOfWeek === 0 || dayOfWeek === 6) baseSessions = 8; // Weekend
      if (dayOfWeek === 2 || dayOfWeek === 3) baseSessions = 25; // Mardi/Mercredi plus actifs

      // Variation aléatoire ±30%
      const dailySessions = Math.floor(
        baseSessions * (0.7 + Math.random() * 0.6),
      );

      for (let sessionIndex = 0; sessionIndex < dailySessions; sessionIndex++) {
        const integrator =
          createdIntegrators[
            Math.floor(Math.random() * createdIntegrators.length)
          ];

        // Générer un timestamp aléatoire dans la journée
        const hour =
          Math.random() < 0.8
            ? 8 + Math.floor(Math.random() * 10) // 80% entre 8h-18h
            : Math.floor(Math.random() * 24); // 20% autres heures

        const minute = Math.floor(Math.random() * 60);
        const sessionDate = new Date(currentDate);
        sessionDate.setHours(hour, minute, 0, 0);

        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Créer la session
        await analyticsService.createUserSession({
          sessionId,
          integratorName: integrator.name,
          userAgent: generateRandomUserAgent(),
          ipAddress: generateRandomIP(),
          createdAt: sessionDate,
          updatedAt: sessionDate,
        });

        totalSessions++;

        // 1. Toutes les sessions initient le parcours
        await analyticsService.trackUserAction({
          sessionId,
          actionType: ActionTypes.PARCOURS_INITIATED,
          actionData: JSON.stringify({ integrator: integrator.name }),
          timestamp: sessionDate,
        });

        // 2. 68% terminent le parcours
        const completeParcours = Math.random() < 0.68;
        if (completeParcours) {
          const completionTime = new Date(
            sessionDate.getTime() + (2 + Math.random() * 8) * 60000,
          ); // 2-10 min plus tard

          await analyticsService.trackUserAction({
            sessionId,
            actionType: ActionTypes.PARCOURS_COMPLETED,
            actionData: JSON.stringify({
              completionTimeMinutes: Math.round(
                (completionTime.getTime() - sessionDate.getTime()) / 60000,
              ),
            }),
            timestamp: completionTime,
          });

          completedSessions++;

          // Générer et sauvegarder un résultat de mutabilité
          await analyticsService.saveResult({
            sessionId,
            indiceResidentiel: 40 + Math.floor(Math.random() * 40),
            indiceEquipements: 35 + Math.floor(Math.random() * 35),
            indiceCulture: 30 + Math.floor(Math.random() * 30),
            indiceTertiaire: 35 + Math.floor(Math.random() * 35),
            indiceIndustrie: 20 + Math.floor(Math.random() * 40),
            indiceRenaturation: 10 + Math.floor(Math.random() * 50),
            indicePhotovoltaique: 20 + Math.floor(Math.random() * 40),
            fiabilite: String((7 + Math.random() * 3).toFixed(1)),
            createdAt: completionTime,
          });

          // 3. 45% de ceux qui terminent cliquent sur "voir tous les résultats détaillés"
          if (Math.random() < 0.45) {
            const detailsTime = new Date(
              completionTime.getTime() + Math.random() * 120000,
            );
            await analyticsService.trackUserAction({
              sessionId,
              actionType: ActionTypes.DETAILS_CLICKED,
              timestamp: detailsTime,
            });
            detailsClicked++;
          }

          // 4. 28% de ceux qui terminent cliquent sur "je souhaite être contacté"
          if (Math.random() < 0.28) {
            const contactTime = new Date(
              completionTime.getTime() + Math.random() * 300000,
            );
            await analyticsService.trackUserAction({
              sessionId,
              actionType: ActionTypes.CONTACT_CLICKED,
              timestamp: contactTime,
            });
            contactClicked++;
          }

          // 5. 22% de ceux qui terminent cliquent sur un lien d'outil annexe
          if (Math.random() < 0.22) {
            const toolTime = new Date(
              completionTime.getTime() + Math.random() * 240000,
            );
            const tools = [
              'outil-cartographie',
              'simulateur-couts',
              'guide-reglementation',
            ];
            const selectedTool =
              tools[Math.floor(Math.random() * tools.length)];

            await analyticsService.trackUserAction({
              sessionId,
              actionType: ActionTypes.TOOL_LINK_CLICKED,
              actionData: JSON.stringify({ tool: selectedTool }),
              timestamp: toolTime,
            });
            toolLinkClicked++;
          }
        }
      }

      console.log(
        `Jour ${day + 1}/${totalDays} traité (${dailySessions} sessions)`,
      );
    }

    // Afficher les statistiques finales
    console.log('\nSTATISTIQUES GÉNÉRÉES:');
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📈 Total sessions créées: ${totalSessions.toLocaleString()}`);
    console.log(
      `Sessions terminées: ${completedSessions.toLocaleString()} (${((completedSessions / totalSessions) * 100).toFixed(1)}%)`,
    );
    console.log(
      `Clics "détails": ${detailsClicked.toLocaleString()} (${((detailsClicked / completedSessions) * 100).toFixed(1)}% des terminées)`,
    );
    console.log(
      `Clics "contact": ${contactClicked.toLocaleString()} (${((contactClicked / completedSessions) * 100).toFixed(1)}% des terminées)`,
    );
    console.log(
      `Clics "outils": ${toolLinkClicked.toLocaleString()} (${((toolLinkClicked / completedSessions) * 100).toFixed(1)}% des terminées)`,
    );
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    console.log("\nSeed des métriques d'impact terminé avec succès !");
  } catch (error) {
    console.error('Erreur lors du seed:', error);
  } finally {
    await app.close();
  }
}

// Fonctions utilitaires pour générer des données réalistes
function generateRandomUserAgent(): string {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  ];
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

function generateRandomIP(): string {
  const ranges = ['77.192', '78.192', '90.2', '92.184'];
  const range = ranges[Math.floor(Math.random() * ranges.length)];
  const third = Math.floor(Math.random() * 255);
  const fourth = Math.floor(Math.random() * 255);
  return `${range}.${third}.${fourth}`;
}

bootstrap().catch((err) => {
  console.error('Erreur lors du seed:', err);
  process.exit(1);
});
