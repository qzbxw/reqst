import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useUI } from "../lib/ui";

type LegalVariant = "privacy" | "terms";

const LEGAL_PROFILE = {
  operatorName: "[Укажи юрлицо / ИП / физлицо-оператора]",
  contactEmail: "legal@your-domain.tld",
  supportEmail: "support@your-domain.tld",
  address: "[Укажи юридический адрес / адрес для уведомлений]",
  jurisdiction: "[Укажи страну и применимое право]",
  domain: "[Укажи основной домен сервиса]",
  refundPolicy: "[Опиши правила возврата или явно укажи no refunds]",
  effectiveDate: {
    ru: "23 марта 2026",
    en: "March 23, 2026",
  },
} as const;

const COPY = {
  privacy: {
    ru: {
      kicker: "PRIVACY POLICY",
      title: "Privacy Policy для reqst",
      summary:
        "Это рабочий черновик privacy-страницы под текущий MVP. Он отражает реальное поведение кода: Telegram auth, seller wallets, invoice metadata, public checkout, payment monitoring и seller notifications. Перед публикацией просто замени реквизиты оператора и финальные юридические параметры.",
      updatedLabel: "Последнее обновление",
      operatorLabel: "Оператор сервиса",
      draftTitle: "Что заполнить перед публикацией",
      draftBody:
        "Ниже уже лежит нормальная структура документа, но тебе нужно заменить персональные реквизиты и финальные правила обработки данных. Без этого privacy будет выглядеть как шаблон, а не как опубликованный документ.",
      draftItems: [
        `Оператор сервиса: ${LEGAL_PROFILE.operatorName}`,
        `Контакт по privacy и legal-запросам: ${LEGAL_PROFILE.contactEmail}`,
        `Основной домен сервиса: ${LEGAL_PROFILE.domain}`,
        `Адрес для уведомлений: ${LEGAL_PROFILE.address}`,
        `Юрисдикция и трансграничная передача данных: ${LEGAL_PROFILE.jurisdiction}`,
      ],
      sections: [
        {
          title: "1. Какие данные мы собираем",
          paragraphs: [
            "Reqst собирает только те данные, которые нужны для аутентификации продавца, создания checkout-ссылок, отслеживания статусов инвойсов и поддержки подписки PRO.",
            "В зависимости от сценария это может включать Telegram ID, username, seller account metadata, payout wallet addresses, invoice titles и amounts, payment status data, tx hashes, публичные on-chain сведения, а также технические данные браузера и local storage keys, которые используются для сохранения темы, языка и seller session token.",
          ],
          bullets: [
            "данные Telegram Mini App auth или dev-auth payload",
            "wallet addresses, network selection и invoice metadata",
            "public invoice identifiers, payment comments и payment URIs",
            "наблюдаемые on-chain события, включая tx hash, amount, network, observed time и raw provider payload",
            "seller notification payloads и operational logs",
          ],
        },
        {
          title: "2. Зачем мы используем данные",
          paragraphs: [
            "Мы используем данные для аутентификации продавца, создания и показа инвойсов, определения статуса платежа, отправки seller notifications, защиты от дублей, расследования проблем с оплатой и работы подписки PRO.",
            "Reqst не использует собранные данные для кастодиального хранения средств, управления приватными ключами или самостоятельного совершения транзакций от имени пользователя.",
          ],
        },
        {
          title: "3. Public checkout и blockchain data",
          paragraphs: [
            "Checkout-страницы в reqst являются публичными по уникальной ссылке. Любой, у кого есть checkout URL, сможет увидеть адрес оплаты, сеть, payable amount, expiration time и status соответствующего инвойса.",
            "On-chain платежи по своей природе могут быть публично наблюдаемыми в блокчейне. Reqst обрабатывает только те публичные сведения, которые нужны для матчинга перевода с invoice flow.",
          ],
        },
        {
          title: "4. Когда мы делимся данными с третьими лицами",
          paragraphs: [
            "Reqst может передавать ограниченный объём данных сторонним провайдерам, которые нужны для работы сервиса. Это включает Telegram для auth и seller notifications, инфраструктурного хостинг-провайдера, а также blockchain/API-провайдеров, через которых мы получаем информацию о переводах и, при необходимости, рыночный курс TON/USD.",
            "Мы не продаём персональные данные пользователей рекламным сетям и не передаём private keys, потому что сервис их вообще не хранит.",
          ],
        },
        {
          title: "5. Сроки хранения",
          paragraphs: [
            "Мы храним seller account data, wallets, invoices, payment events и audit-relevant operational records столько, сколько это разумно нужно для работы сервиса, бухгалтерии, разрешения споров, безопасности и соблюдения применимого права.",
            "Точный retention schedule зависит от твоей юрисдикции и модели оператора сервиса, поэтому финальную политику хранения данных тебе стоит зафиксировать отдельно перед запуском.",
          ],
        },
        {
          title: "6. Безопасность",
          paragraphs: [
            "Reqst принимает разумные технические и организационные меры для защиты данных, но ни один интернет-сервис не может гарантировать абсолютную безопасность. Пользователь также отвечает за безопасность своего Telegram-аккаунта, устройства и payout wallet setup.",
            "Reqst не хранит private keys и не должен запрашивать сид-фразы, secret recovery phrases или приватные ключи пользователя.",
          ],
        },
        {
          title: "7. Права пользователя",
          paragraphs: [
            "В зависимости от применимого права пользователь может иметь право запросить доступ к данным, исправление, удаление, ограничение обработки или экспорт данных. Такие запросы следует направлять на указанный privacy contact.",
            `Контакт для privacy-запросов: ${LEGAL_PROFILE.contactEmail}.`,
          ],
        },
        {
          title: "8. Cookies и local storage",
          paragraphs: [
            "На текущем MVP frontend использует local storage для seller session token, выбранной темы и языка. Если позже ты добавишь аналитику, маркетинговые cookie или сторонние пиксели, privacy и cookie notice нужно будет обновить отдельно.",
          ],
        },
        {
          title: "9. Международная передача данных",
          paragraphs: [
            `Если инфраструктура, Telegram или blockchain-провайдеры работают в других странах, данные могут обрабатываться за пределами основной юрисдикции оператора. В финальной версии документа нужно указать, как именно ${LEGAL_PROFILE.operatorName} оформляет такие передачи данных в своей юрисдикции.`,
          ],
        },
        {
          title: "10. Контакты",
          paragraphs: [
            `Оператор сервиса: ${LEGAL_PROFILE.operatorName}.`,
            `Email для privacy и legal-вопросов: ${LEGAL_PROFILE.contactEmail}.`,
            `Адрес для официальных уведомлений: ${LEGAL_PROFILE.address}.`,
          ],
        },
      ],
      footerNote: "Этот черновик сверстан под текущий MVP reqst и всё ещё требует твоих реквизитов и финальной legal-проверки.",
    },
    en: {
      kicker: "PRIVACY POLICY",
      title: "Privacy Policy for reqst",
      summary:
        "This is a working draft privacy page for the current MVP. It reflects the actual code paths: Telegram auth, seller wallets, invoice metadata, public checkout, payment monitoring, and seller notifications. Replace the operator details and final legal settings before publishing.",
      updatedLabel: "Last updated",
      operatorLabel: "Service operator",
      draftTitle: "Fill these items before publishing",
      draftBody:
        "The structure is already here, but you still need to replace the operator details and final data-processing rules. Without that, the page stays a draft rather than a publishable policy.",
      draftItems: [
        `Service operator: ${LEGAL_PROFILE.operatorName}`,
        `Privacy and legal contact: ${LEGAL_PROFILE.contactEmail}`,
        `Primary service domain: ${LEGAL_PROFILE.domain}`,
        `Notice address: ${LEGAL_PROFILE.address}`,
        `Jurisdiction and cross-border transfer basis: ${LEGAL_PROFILE.jurisdiction}`,
      ],
      sections: [
        {
          title: "1. Data we collect",
          paragraphs: [
            "Reqst collects only the data needed to authenticate sellers, create checkout links, track invoice status, and operate the PRO subscription flow.",
            "Depending on the use case, this may include Telegram ID, username, seller account metadata, payout wallet addresses, invoice titles and amounts, payment status data, tx hashes, public on-chain information, and technical browser or local-storage data used for theme, language, and seller session tokens.",
          ],
          bullets: [
            "Telegram Mini App auth data or development auth payloads",
            "wallet addresses, network selection, and invoice metadata",
            "public invoice identifiers, payment comments, and payment URIs",
            "observed on-chain events, including tx hash, amount, network, observed time, and raw provider payload",
            "seller notification payloads and operational logs",
          ],
        },
        {
          title: "2. Why we use data",
          paragraphs: [
            "We use data to authenticate sellers, create and display invoices, determine payment status, send seller notifications, prevent duplicate processing, investigate payment issues, and operate the PRO subscription.",
            "Reqst does not use collected data for custodial fund storage, private-key management, or autonomous transaction execution on behalf of users.",
          ],
        },
        {
          title: "3. Public checkout and blockchain data",
          paragraphs: [
            "Reqst checkout pages are public by unique link. Anyone with the checkout URL may be able to view the payment address, network, payable amount, expiration time, and status for that invoice.",
            "Blockchain transfers may be publicly observable by nature. Reqst processes only the public on-chain information needed to match transfers to invoice flows.",
          ],
        },
        {
          title: "4. When we share data with third parties",
          paragraphs: [
            "Reqst may share limited data with service providers required to operate the product. This includes Telegram for auth and seller notifications, infrastructure hosting providers, and blockchain or market-data providers used to observe transfers and, when relevant, fetch TON/USD pricing.",
            "We do not sell personal data to advertisers, and we do not share private keys because the service does not store them at all.",
          ],
        },
        {
          title: "5. Retention",
          paragraphs: [
            "We retain seller account data, wallets, invoices, payment events, and operational records for as long as reasonably necessary to operate the service, maintain security, resolve disputes, support accounting, and comply with applicable law.",
            "The exact retention schedule depends on your jurisdiction and operating structure, so the final retention language should be reviewed before launch.",
          ],
        },
        {
          title: "6. Security",
          paragraphs: [
            "Reqst applies reasonable technical and organizational safeguards, but no internet service can guarantee absolute security. Users are also responsible for the security of their Telegram account, device, and payout wallet setup.",
            "Reqst does not store private keys and should never request a seed phrase, recovery phrase, or private key from a user.",
          ],
        },
        {
          title: "7. User rights",
          paragraphs: [
            "Depending on applicable law, users may have rights to request access, correction, deletion, restriction, or export of their data. Requests should be sent to the privacy contact listed below.",
            `Privacy contact: ${LEGAL_PROFILE.contactEmail}.`,
          ],
        },
        {
          title: "8. Cookies and local storage",
          paragraphs: [
            "The current MVP frontend uses local storage for the seller session token and UI preferences such as theme and language. If you later add analytics, marketing cookies, or third-party pixels, this policy and any cookie notice should be updated separately.",
          ],
        },
        {
          title: "9. International transfers",
          paragraphs: [
            `If infrastructure, Telegram, or blockchain providers operate in other countries, data may be processed outside the operator’s home jurisdiction. The final version should explain how ${LEGAL_PROFILE.operatorName} handles those transfers under applicable law.`,
          ],
        },
        {
          title: "10. Contact",
          paragraphs: [
            `Service operator: ${LEGAL_PROFILE.operatorName}.`,
            `Privacy and legal contact: ${LEGAL_PROFILE.contactEmail}.`,
            `Notice address: ${LEGAL_PROFILE.address}.`,
          ],
        },
      ],
      footerNote: "This draft matches the current reqst MVP but still needs your operator details and legal review before publication.",
    },
  },
  terms: {
    ru: {
      kicker: "TERMS OF SERVICE",
      title: "Terms of Service для reqst",
      summary:
        "Это черновик пользовательских условий под фактический продукт: seller console, checkout links, payment matching, PRO subscription и non-custodial модель. Документ уже нормальный по структуре, но тебе нужно подставить свои реквизиты, правила refund и юрисдикцию.",
      updatedLabel: "Последнее обновление",
      operatorLabel: "Оператор сервиса",
      draftTitle: "Что заполнить перед публикацией",
      draftBody:
        "Terms должны быть привязаны к конкретному оператору сервиса, твоей юрисдикции и политике возвратов. Ниже это отмечено явно, чтобы ты быстро добил документ до релизной версии.",
      draftItems: [
        `Оператор сервиса: ${LEGAL_PROFILE.operatorName}`,
        `Контакт поддержки: ${LEGAL_PROFILE.supportEmail}`,
        `Юридический адрес / адрес для претензий: ${LEGAL_PROFILE.address}`,
        `Применимое право и место разрешения споров: ${LEGAL_PROFILE.jurisdiction}`,
        `Refund policy по подписке: ${LEGAL_PROFILE.refundPolicy}`,
      ],
      sections: [
        {
          title: "1. О чём этот сервис",
          paragraphs: [
            "Reqst предоставляет software layer для создания checkout-ссылок, отображения платёжных реквизитов, отслеживания on-chain переводов и показа статусов инвойсов продавцу. Сервис ориентирован на solo sellers и небольшие digital-команды, работающие через Telegram и прямые криптоплатежи.",
            `Оператор сервиса: ${LEGAL_PROFILE.operatorName}.`,
          ],
        },
        {
          title: "2. Non-custodial модель",
          paragraphs: [
            "Reqst не хранит средства пользователей и не выступает кастодианом. Покупатель переводит средства напрямую на payout wallet продавца, который продавец подключил в сервисе.",
            "Пользователь самостоятельно отвечает за корректность кошельков, адресов, доступов и контроль над своими приватными ключами. Потеря private keys, сид-фраз или доступа к кошельку находится вне контроля reqst.",
          ],
        },
        {
          title: "3. Аккаунт продавца и допустимое использование",
          paragraphs: [
            "Продавец обязан предоставлять правдивые сведения для входа и использовать сервис только для законной деятельности. Запрещается использовать reqst для мошенничества, отмывания средств, обхода санкций, продажи запрещённых товаров или услуг, а также любых действий, нарушающих применимое право.",
            "Reqst может ограничить или заблокировать аккаунт продавца при нарушении этих условий, требованиях закона, злоупотреблениях, жалобах на мошенничество или операционном риске.",
          ],
        },
        {
          title: "4. Тарифы, триал и подписка PRO",
          paragraphs: [
            "На текущем MVP trial позволяет создать до 15 инвойсов. После исчерпания trial новые merchant invoices могут быть ограничены до активации PRO.",
            "PRO на текущем MVP стоит 39 USDT за 30 дней. Цена, trial limits и billing rules могут меняться в будущем, если это будет отдельно опубликовано в сервисе или в обновлённых условиях.",
            `Политику возвратов по подписке тебе нужно зафиксировать отдельно: ${LEGAL_PROFILE.refundPolicy}.`,
          ],
        },
        {
          title: "5. Платежи, сети и классификация",
          paragraphs: [
            "Reqst поддерживает ограниченный набор сетей и payment matching rules. Для TON используется связка payout wallet + payment comment. Для stablecoin flows используется exact amount с уникальным suffix. Платежи с неправильной суммой, не тем comment или после expiry могут перейти в underpaid или manual review.",
            "Reqst не гарантирует, что любой ошибочный платёж будет автоматически успешно сматчен. Пользователь понимает риск blockchain-finality, сетевых комиссий, задержек провайдеров и ошибок отправителя.",
          ],
        },
        {
          title: "6. Доступность сервиса",
          paragraphs: [
            "Reqst стремится поддерживать сервис в рабочем состоянии, но не гарантирует непрерывную или безошибочную работу. Возможны остановки из-за обновлений, сбоев инфраструктуры, Telegram, blockchain/API-провайдеров, rate limits и внешних сетевых проблем.",
            "Некоторые статусы и уведомления в MVP могут быть консервативными: например, поздние оплаты отправляются в manual review, а не подтверждаются автоматически.",
          ],
        },
        {
          title: "7. Ограничение ответственности",
          paragraphs: [
            "В максимально допустимой законом степени reqst предоставляется по модели as is и as available. Оператор сервиса не несёт ответственности за рыночную волатильность, ошибки пользователя в адресе или сети, потерю доступа к кошельку, действия сторонних провайдеров, а также косвенные убытки, упущенную выгоду или репутационный ущерб.",
            "Если применимое право требует иного, такие ограничения действуют в максимально допустимом объёме.",
          ],
        },
        {
          title: "8. Прекращение доступа",
          paragraphs: [
            "Пользователь может прекратить использование сервиса в любой момент. Reqst может приостановить или прекратить доступ в случае нарушений, злоупотреблений, fraud-risk, требований закона или закрытия сервиса.",
          ],
        },
        {
          title: "9. Применимое право и споры",
          paragraphs: [
            `Эти условия должны регулироваться правом и процедурой разрешения споров, которые ты укажешь здесь: ${LEGAL_PROFILE.jurisdiction}.`,
          ],
        },
        {
          title: "10. Контакты",
          paragraphs: [
            `Оператор сервиса: ${LEGAL_PROFILE.operatorName}.`,
            `Контакт поддержки: ${LEGAL_PROFILE.supportEmail}.`,
            `Адрес для уведомлений и претензий: ${LEGAL_PROFILE.address}.`,
          ],
        },
      ],
      footerNote: "Этот черновик terms уже привязан к реальному поведению reqst, но без твоих реквизитов и refund policy публиковать его рано.",
    },
    en: {
      kicker: "TERMS OF SERVICE",
      title: "Terms of Service for reqst",
      summary:
        "This is a working terms draft for the actual product: seller console, checkout links, payment matching, PRO subscription, and a non-custodial model. The structure is ready, but you still need to insert your operator details, refund rules, and governing law.",
      updatedLabel: "Last updated",
      operatorLabel: "Service operator",
      draftTitle: "Fill these items before publishing",
      draftBody:
        "The terms must point to a real service operator, your governing law, and your refund approach. The placeholders below are intentionally explicit so you can finish the document quickly.",
      draftItems: [
        `Service operator: ${LEGAL_PROFILE.operatorName}`,
        `Support contact: ${LEGAL_PROFILE.supportEmail}`,
        `Legal or notice address: ${LEGAL_PROFILE.address}`,
        `Governing law and dispute venue: ${LEGAL_PROFILE.jurisdiction}`,
        `Subscription refund policy: ${LEGAL_PROFILE.refundPolicy}`,
      ],
      sections: [
        {
          title: "1. What the service does",
          paragraphs: [
            "Reqst provides a software layer for generating checkout links, displaying payment details, monitoring on-chain transfers, and showing invoice status to sellers. The service is designed for solo sellers and small digital teams using Telegram and direct crypto payments.",
            `Service operator: ${LEGAL_PROFILE.operatorName}.`,
          ],
        },
        {
          title: "2. Non-custodial model",
          paragraphs: [
            "Reqst does not hold user funds and does not act as a custodian. Buyers send funds directly to the seller payout wallet configured in the service.",
            "Users are responsible for wallet correctness, access control, and the security of their own private keys. Loss of private keys, seed phrases, or wallet access is outside reqst control.",
          ],
        },
        {
          title: "3. Seller account and acceptable use",
          paragraphs: [
            "Sellers must provide truthful sign-in information and use the service only for lawful activity. Reqst may not be used for fraud, money laundering, sanctions evasion, prohibited goods or services, or any activity that violates applicable law.",
            "Reqst may restrict or block seller accounts for violations, abuse, fraud complaints, legal requirements, or operational risk concerns.",
          ],
        },
        {
          title: "4. Pricing, trial, and PRO subscription",
          paragraphs: [
            "On the current MVP, the trial includes up to 15 invoices. After the trial is exhausted, new merchant invoices may be limited until PRO is activated.",
            "On the current MVP, PRO costs 39 USDT for 30 days. Pricing, trial limits, and billing rules may change in the future if separately published in the service or updated terms.",
            `You should lock down your subscription refund rule before launch: ${LEGAL_PROFILE.refundPolicy}.`,
          ],
        },
        {
          title: "5. Payments, networks, and classification",
          paragraphs: [
            "Reqst supports a limited set of networks and matching rules. TON uses payout wallet plus payment comment. Stablecoin flows use exact amount with a unique suffix. Wrong-amount transfers, missing comments, or late payments may fall into underpaid or manual review states.",
            "Reqst does not guarantee that every incorrect payment will be matched automatically. Users accept the risks of blockchain finality, network fees, provider delays, and sender error.",
          ],
        },
        {
          title: "6. Service availability",
          paragraphs: [
            "Reqst aims to keep the service available, but does not guarantee uninterrupted or error-free operation. Downtime may occur due to updates, infrastructure failure, Telegram outages, blockchain or API-provider issues, rate limits, or external network conditions.",
            "Some statuses and notifications in the MVP are intentionally conservative. For example, late transfers may be routed to manual review instead of being auto-confirmed.",
          ],
        },
        {
          title: "7. Limitation of liability",
          paragraphs: [
            "To the maximum extent permitted by law, reqst is provided on an as is and as available basis. The operator is not liable for market volatility, user mistakes in wallet address or network selection, lost wallet access, third-party provider actions, or indirect damages, lost profits, or reputational harm.",
            "If applicable law requires a narrower limitation, this clause applies only to the maximum extent allowed.",
          ],
        },
        {
          title: "8. Suspension and termination",
          paragraphs: [
            "Users may stop using the service at any time. Reqst may suspend or terminate access in response to violations, abuse, fraud risk, legal requirements, or service shutdown.",
          ],
        },
        {
          title: "9. Governing law and disputes",
          paragraphs: [
            `These terms should be governed by the law and dispute process you insert here: ${LEGAL_PROFILE.jurisdiction}.`,
          ],
        },
        {
          title: "10. Contact",
          paragraphs: [
            `Service operator: ${LEGAL_PROFILE.operatorName}.`,
            `Support contact: ${LEGAL_PROFILE.supportEmail}.`,
            `Notice address: ${LEGAL_PROFILE.address}.`,
          ],
        },
      ],
      footerNote: "This terms draft matches the current reqst behavior, but it still needs your operator details and refund policy before it is ready to publish.",
    },
  },
} as const;

export function LegalPage({ variant }: { variant: LegalVariant }) {
  const { language, setLanguage, theme } = useUI();
  const copy = COPY[variant][language];

  useEffect(() => {
    document.documentElement.dataset.theme = "dark";
    return () => {
      document.documentElement.dataset.theme = theme;
    };
  }, [theme]);

  return (
    <main className="legal-page">
      <div className="lend-backdrop lend-backdrop--grid" />
      <div className="lend-backdrop lend-backdrop--glow lend-backdrop--left" />
      <div className="lend-backdrop lend-backdrop--glow lend-backdrop--right" />

      <div className="lend-shell lend-shell--legal">
        <header className="legal-topbar">
          <Link className="lend-brand" to="/lend">
            <strong>reqst</strong>
          </Link>

          <div className="lend-topbar-actions">
            <div className="lend-language" role="group" aria-label="language switcher">
              <button type="button" className={language === "ru" ? "active" : ""} onClick={() => setLanguage("ru")}>
                РУ
              </button>
              <button type="button" className={language === "en" ? "active" : ""} onClick={() => setLanguage("en")}>
                EN
              </button>
            </div>
            <Link className="lend-nav-link" to="/lend">
              /lend
            </Link>
            <Link className="lend-primary" to="/">
              Console
            </Link>
          </div>
        </header>

        <section className="legal-hero legal-fade legal-fade--1">
          <span className="lend-section-kicker">{copy.kicker}</span>
          <h1>{copy.title}</h1>
          <p>{copy.summary}</p>

          <div className="legal-meta">
            <span>
              {copy.updatedLabel}: {LEGAL_PROFILE.effectiveDate[language]}
            </span>
            <span>
              {copy.operatorLabel}: {LEGAL_PROFILE.operatorName}
            </span>
          </div>
        </section>

        <section className="legal-note legal-fade legal-fade--2">
          <div>
            <h2>{copy.draftTitle}</h2>
            <p>{copy.draftBody}</p>
          </div>

          <ul className="legal-token-list">
            {copy.draftItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="legal-sections">
          {copy.sections.map((section, index) => (
            <article key={section.title} className={`legal-card legal-fade legal-fade--${(index % 4) + 1}`}>
              <div className="legal-card-number">{String(index + 1).padStart(2, "0")}</div>
              <div className="legal-card-copy">
                <h2>{section.title}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {"bullets" in section ? (
                  <ul className="legal-bullet-list">
                    {section.bullets.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </article>
          ))}
        </section>

        <footer className="lend-footer lend-footer--legal">
          <p>{copy.footerNote}</p>
          <div className="lend-footer-links">
            <Link to="/lend">/lend</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
