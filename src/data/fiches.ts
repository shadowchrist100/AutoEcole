export type FichePoint = { title: string; text: string };

export type Fiche = {
  id: string;
  title: string;
  subtitle: string;
  points: FichePoint[];
  source: string;
};

export const FICHES: Fiche[] = [
  {
    id: "vocabulaire",
    title: "Le vocabulaire de la route",
    subtitle: "Les définitions de base employées dans tout le manuel",
    source: "Chapitre I — Définitions et rappels",
    points: [
      {
        title: "Le code de la route",
        text: "L'ensemble des conventions et des protocoles destinés à faciliter une circulation routière sûre et rapide. Il indique ou rappelle les prescriptions aux usagers de la route.",
      },
      {
        title: "La route",
        text: "Un passage spécialement aménagé et ouvert à la circulation publique, revêtu ou non. À la traversée d'une ville, la route devient une rue.",
      },
      {
        title: "La route pour automobile",
        text: "Une route réservée aux véhicules à moteur, à l'exception des cyclomoteurs. Elle comporte deux chaussées séparées par des glissières ou un terre-plein central et peut avoir des intersections.",
      },
      {
        title: "L'autoroute",
        text: "Deux chaussées séparées par un terre-plein central, réservée à la circulation rapide des véhicules à moteur. Elle ne comporte pas d'intersection et n'est accessible qu'à des points aménagés.",
      },
      {
        title: "Chaussée, voie, intersection",
        text: "La chaussée est la partie de la route réservée aux véhicules. La voie est une subdivision de la chaussée permettant la circulation d'une file de véhicules. L'intersection est le lieu de jonction ou de croisement de deux ou plusieurs chaussées.",
      },
      {
        title: "L'agglomération",
        text: "Un espace où sont groupés des immeubles bâtis rapprochés. Son entrée et sa sortie sont signalées par des panneaux placés le long de la route.",
      },
      {
        title: "Piste et bande cyclable",
        text: "La piste cyclable longe la chaussée et est réservée aux cycles et cyclomoteurs. La bande cyclable est la voie d'une chaussée à plusieurs voies réservée à ces mêmes usagers.",
      },
      {
        title: "Le permis de conduire",
        text: "Une autorisation officielle de conduire les véhicules à moteur d'une catégorie donnée.",
      },
      {
        title: "Le véhicule",
        text: "Un moyen de déplacement ou de transport terrestre, muni ou non d'un moteur.",
      },
    ],
  },
  {
    id: "signalisations",
    title: "Les quatre signalisations",
    subtitle: "Reconnaître d'un coup d'œil ce qui vous parle sur la route",
    source: "Chapitre II — Signalisation",
    points: [
      {
        title: "La signalisation verticale",
        text: "Les panneaux et panonceaux implantés le long de la route. Ils préviennent d'un danger, imposent une prescription ou donnent une indication.",
      },
      {
        title: "La signalisation horizontale",
        text: "L'ensemble des marques peintes sur la chaussée : lignes continues, discontinues, mixtes, flèches, zébras et marquages de bordure.",
      },
      {
        title: "La signalisation lumineuse",
        text: "Les feux tricolores et les feux clignotants qui règlent la circulation à une intersection.",
      },
      {
        title: "Les signes des agents",
        text: "Les gestes des agents de sécurité réglementent la circulation et prévalent sur les feux et les panneaux.",
      },
    ],
  },
  {
    id: "panneaux",
    title: "Les quatre familles de panneaux",
    subtitle: "Forme, couleur et signification",
    source: "Chapitre I — Les panneaux de signalisation",
    points: [
      {
        title: "Les panneaux de danger",
        text: "De forme triangulaire à listel rouge. Ce sont des signalisations avancées, placées avant la zone dangereuse : à 50 m en agglomération et à 150 m en rase campagne. À leur rencontre, on réduit sa vitesse en serrant sa droite.",
      },
      {
        title: "Les panneaux d'interdiction",
        text: "De forme ronde et de couleur rouge. Ils interdisent un comportement à partir du panneau, sauf indication contraire d'un panonceau.",
      },
      {
        title: "Les panneaux d'obligation",
        text: "De forme ronde et de couleur bleue. Ils imposent un comportement ou une direction.",
      },
      {
        title: "Les panneaux de fin",
        text: "Les ronds bleus barrés de rouge mettent fin à une obligation. Les ronds blancs barrés de noir mettent fin à une interdiction.",
      },
      {
        title: "Les panneaux d'indication et de renseignement",
        text: "De forme carrée ou rectangulaire. Ils informent sans imposer : itinéraires, services, lieux-dits.",
      },
      {
        title: "Les panneaux d'intersection et de priorité",
        text: "Ils se présentent sous diverses formes et annoncent le régime de priorité d'une intersection ou d'un carrefour.",
      },
      {
        title: "Les panonceaux",
        text: "Placés sous un panneau, ils en précisent la portée : distance, catégorie de véhicules concernés, étendue de l'interdiction.",
      },
    ],
  },
  {
    id: "balises",
    title: "Les balises",
    subtitle: "Repérer les obstacles et suivre la route",
    source: "Chapitre I — Les balises",
    points: [
      {
        title: "À quoi elles servent",
        text: "Les balises sont des dispositifs implantés le long des routes pour signaler ou indiquer la position d'un obstacle dangereux.",
      },
      {
        title: "Les principales balises",
        text: "Balise de virage, balise de manche à air, balise de virage dangereux (qui peut aussi indiquer un rétrécissement de la chaussée), balise d'intersection, délinéateurs, balisage des passages à niveau, balise à tête d'îlot directionnel, balise d'obstacle et balises d'alignement.",
      },
    ],
  },
  {
    id: "prioritaires",
    title: "Les véhicules prioritaires",
    subtitle: "Qui est prioritaire, et à quelle condition",
    source: "Chapitre I — Les véhicules prioritaires",
    points: [
      {
        title: "Les quatre catégories",
        text: "Les véhicules de police, de la gendarmerie, des sapeurs-pompiers, ainsi que les véhicules du SAMU (Service d'Aide Médicale d'Urgence) et du SMUR (Service Médical d'Urgence et de Réanimation).",
      },
      {
        title: "La condition de priorité",
        text: "Un véhicule est dit prioritaire lorsqu'il est en mission et fait usage de ses avertisseurs sonores et/ou lumineux. Hors mission, il n'est pas prioritaire.",
      },
    ],
  },
  {
    id: "permis-b",
    title: "Le permis B",
    subtitle: "Le véhicule de tourisme et la remorque",
    source: "Chapitre I — Définition du permis B",
    points: [
      {
        title: "Ce que le permis B autorise",
        text: "Tout véhicule affecté au transport de personnes ou de marchandises dont le PTAC ne dépasse pas 3,5 tonnes, ou comportant 8 places non compris le siège du conducteur.",
      },
      {
        title: "L'âge minimal",
        text: "18 ans pour passer l'examen du permis B.",
      },
      {
        title: "La remorque",
        text: "Une remorque ou une caravane peut être attelée si son PTAC ne dépasse pas 750 kg.",
      },
    ],
  },
  {
    id: "categories",
    title: "Les catégories de permis",
    subtitle: "Âges et véhicules autorisés, selon le manuel",
    source: "Chapitre I — Les autres catégories de permis",
    points: [
      { title: "A1", text: "Vélomoteur ou cyclomoteur de 75 cm³ au plus. Âge minimal : 16 ans." },
      { title: "A2", text: "Motocyclette ou quadricycle de 75 à 400 cm³. Âge minimal : 18 ans." },
      { title: "A3", text: "Motocycle, tricycle ou quadricycle de plus de 400 cm³. Âge minimal : 21 ans." },
      { title: "C", text: "Véhicule affecté au transport de marchandises ou de matériels dont le PTAC ne dépasse pas 18 tonnes." },
      { title: "C1", text: "Véhicule affecté au transport de marchandises ou de matériel dont le PTAC dépasse 18 tonnes. Âge minimal : 21 ans." },
      {
        title: "Dr (TCR)",
        text: "Véhicule affecté au transport en commun de personnes de 18 places au plus et de PTAC d'au plus 3,5 tonnes. Âge minimal : 21 ans.",
      },
      {
        title: "D",
        text: "Véhicule de transport en commun de personnes de plus de 18 places et dont le PTAC dépasse 3,5 tonnes. Âge minimal : 21 ans.",
      },
      { title: "F", text: "Permis spécialement destiné aux personnes handicapées physiques." },
    ],
  },
];

export const MODULE_INTROS: Record<string, string> = {
  generalites:
    "Le socle du code de la route : le vocabulaire, les familles de panneaux, les balises, les véhicules prioritaires et les catégories de permis.",
  signalisation:
    "Tout ce qui guide et contraint le conducteur : panneaux, marquages au sol, feux tricolores et gestes des agents de sécurité.",
  priorites:
    "Les règles qui départagent les usagers à une intersection, en dépassement et au croisement. Le module le plus dense du manuel.",
  manoeuvres:
    "S'arrêter, stationner, s'insérer dans la circulation, changer de direction et de vitesse sans gêner ni surprendre.",
  autoroute:
    "Les règles spécifiques à la route pour automobile et à l'autoroute : accès, voies, vitesse, arrêt d'urgence et comportement.",
  infractions:
    "Les infractions au code de la route, l'incivisme au volant et les gestes de secours qui peuvent sauver une vie.",
  "permis-a":
    "Cyclomoteurs et motocyclettes : équipement, passager, panne et règles propres aux deux-roues.",
  "permis-b":
    "Le véhicule de tourisme : conduite, priorités et manœuvres propres à la catégorie B.",
  "permis-c":
    "Le transport de marchandises : catégories C et C1, âges, chargement et règles spécifiques.",
  "permis-d":
    "Le transport en commun de personnes : catégorie D, sécurité des passagers et conduite du véhicule.",
  equipement:
    "L'équipement, l'entretien et les documents administratifs du véhicule : ce qui doit être en état et ce qu'il faut pouvoir présenter.",
};

const FICHE_MODULES: Record<string, string[]> = {
  generalites: FICHES.map((f) => f.id),
  signalisation: ["signalisations", "panneaux", "balises", "prioritaires"],
};

export function fichesForModule(moduleId: string): Fiche[] {
  const ids = FICHE_MODULES[moduleId];
  if (!ids) return [];
  return ids.map((id) => FICHES.find((f) => f.id === id)).filter((f): f is Fiche => Boolean(f));
}
