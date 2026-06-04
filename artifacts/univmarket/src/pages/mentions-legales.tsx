import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

export default function MentionsLegales() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const sections = [
    {
      key: "publisher",
      title: "Éditeur de la plateforme",
      content: (
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Nom de la plateforme : UnivMarket</p>
          <p>Développeur : Meghraoui Chiheb</p>
          <p>Email : chihebmeghraoui@gmail.com</p>
          <p>Téléphone : +213 656 247 391</p>
          <p>Instagram : @chiheb_meg</p>
          <p>Pays : Algérie</p>
        </div>
      ),
    },
    {
      key: "host",
      title: "Hébergeur",
      content: (
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Frontend : Vercel Inc., San Francisco, USA — vercel.com</p>
          <p>Backend : Railway App — railway.app</p>
          <p>Base de données : Neon.tech (PostgreSQL serverless) — neon.tech</p>
        </div>
      ),
    },
    {
      key: "cgu",
      title: "Conditions Générales d'Utilisation",
      content: (
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>La plateforme UnivMarket est un marché universitaire algérien permettant aux étudiants et professionnels de proposer et commander des services académiques (thèses, mémoires, PPT, traduction, développement web, design, etc.).</p>
          <p>L'utilisation de la plateforme implique l'acceptation des présentes conditions.</p>
          <p>Tout utilisateur doit avoir au minimum 18 ans ou être étudiant inscrit dans un établissement universitaire algérien.</p>
          <p>Les services proposés doivent être légaux et conformes à la législation algérienne.</p>
          <p>UnivMarket se réserve le droit de suspendre tout compte ne respectant pas les règles.</p>
        </div>
      ),
    },
    {
      key: "cgv",
      title: "Conditions Générales de Vente",
      content: (
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Les prix sont affichés en Dinars Algériens (DZD).</p>
          <p>Le paiement est sécurisé via le système Escrow — les fonds sont bloqués jusqu'à la confirmation de livraison.</p>
          <p>Méthodes de paiement acceptées : CIB, BaridiMob, Dahabia, PayPal.</p>
          <p>Une commission de plateforme est prélevée sur chaque transaction.</p>
          <p>La facturation est automatique après chaque commande complétée.</p>
        </div>
      ),
    },
    {
      key: "privacy",
      title: "Politique de confidentialité",
      content: (
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Les données personnelles collectées sont : nom, email, téléphone, wilaya, avatar.</p>
          <p>Ces données sont utilisées uniquement pour le fonctionnement de la plateforme.</p>
          <p>Aucune donnée n'est vendue à des tiers.</p>
          <p>Les données sont conservées sur des serveurs sécurisés (Neon.tech, Vercel, Railway).</p>
          <p>Conformément à la loi algérienne 18-05, vous disposez d'un droit d'accès, de rectification et de suppression de vos données — contact : chihebmeghraoui@gmail.com.</p>
        </div>
      ),
    },
    {
      key: "retract",
      title: "Droit de rétractation",
      content: (
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Conformément à la loi 18-05 du 10 mai 2018, le client dispose de 7 jours calendaires pour annuler une commande sans frais, à condition que le vendeur n'ait pas encore commencé le travail.</p>
          <p>Après acceptation du vendeur et début des travaux, des frais d'annulation peuvent s'appliquer selon les conditions définies dans le contrat numérique.</p>
        </div>
      ),
    },
    {
      key: "retention",
      title: "Durée de conservation des données",
      content: (
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Conformément à la loi algérienne, les données transactionnelles sont conservées pendant 10 ans.</p>
          <p>Les données de compte sont conservées jusqu'à la suppression du compte par l'utilisateur.</p>
          <p>Après suppression, les données sont archivées pendant 1 an puis définitivement effacées.</p>
        </div>
      ),
    },
    {
      key: "disputes",
      title: "Règlement des litiges",
      content: (
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>En cas de litige entre client et vendeur, une procédure de médiation est disponible via la plateforme.</p>
          <p>L'administrateur statue sur les litiges dans un délai de 72 heures.</p>
          <p>En cas de désaccord persistant, la juridiction compétente est celle du tribunal d'Alger, conformément au droit algérien.</p>
        </div>
      ),
    },
    {
      key: "contact",
      title: "Contact",
      content: (
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Email : chihebmeghraoui@gmail.com</p>
          <p>Téléphone / WhatsApp : +213 656 247 391</p>
          <p>Instagram : @chiheb_meg</p>
          <p>Formulaire de contact disponible sur la plateforme.</p>
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10" dir={isRTL ? "rtl" : "ltr"}>
      <div className="mb-8 space-y-3 text-center">
        <p className="text-sm uppercase tracking-widest text-primary">{t("legal_notices")}</p>
        <h1 className="text-3xl font-bold">{t("legal_title")}</h1>
        <p className="text-muted-foreground">{t("legal_subtitle")}</p>
      </div>
      <Card>
        <CardContent className="space-y-6 pt-6">
          <Accordion type="single" collapsible>
            {sections.map(({ key, title, content }) => (
              <AccordionItem key={key} value={key}>
                <AccordionTrigger>{title}</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">{content}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}