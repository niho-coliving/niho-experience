// このファイルは scripts/gen-types.ts が contract/experience-public-api.openapi.json から生成する。手で編集しない。
// 更新: npm -C packages/api-client run gen:types
export type paths = {
    "/api/public/experiences": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 掲載中の体験の一覧
         * @description 体験サイトへ掲載中の体験だけを返す。下書き・審査中・掲載停止・販売者の準備が外れた体験は含めない。残席は含めない（availability を使う）。
         */
        get: operations["listExperiences"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/public/experiences/{experienceSlug}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 体験の詳細
         * @description SSR・SEO 用の公開本文と商品条件。残席は含めない。掲載中でない体験は存在の有無を区別せず 404。
         */
        get: operations["getExperience"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/public/experiences/{experienceSlug}/availability": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 開催回と残席
         * @description 今日（日本時間）から 90 日の開催回。共有キャッシュしない。表示用の目安で、席の確保は checkout が行う。
         */
        get: operations["getExperienceAvailability"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/public/experiences/{experienceSlug}/checkout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * ゲスト予約の開始（席の仮押さえと Stripe Checkout）
         * @description 旅行者のブラウザから直接送る（サーバーから代理送信しない。IP の制限が旅行者ごとに効くようにするため）。`credentials: "omit"`。金額・販売者・決済口座は NIHO が決める。成功時は NIHO が用意した Stripe の URL へ遷移し、決済後は NIHO の予約確認ページへ戻る。
         */
        post: operations["startExperienceCheckout"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
};
export type webhooks = Record<string, never>;
export type components = {
    schemas: {
        /** @description 提供者が書いた申込時の質問（翻訳しない）。回答は提供者に届く。 */
        BookingQuestion: {
            description: string | null;
            id: string;
            /** @enum {string} */
            inputType: "SHORT_TEXT" | "LONG_TEXT" | "SINGLE_SELECT" | "MULTI_SELECT";
            /** @description 記述式は空配列、選択式は 2〜8。 */
            options: components["schemas"]["BookingQuestionOption"][];
            prompt: string;
            required: boolean;
        };
        BookingQuestionOption: {
            id: string;
            label: string;
        };
        BookingTerms: {
            /** @description 今この体験の申込を受け付けるか。false のときは予約の入口を出さない（体験の紹介は出してよい）。 */
            checkoutAvailable: boolean;
            /** @description 旅行者が同意する文書の版。checkout の consent.agreedVersion にそのまま送る。 */
            consentVersion: string;
            /** @enum {string} */
            currency: "JPY";
            legalDocuments: components["schemas"]["LegalDocument"][];
            /** @enum {string} */
            timeZone: "Asia/Tokyo";
        };
        /** @description 申込時に予約へ固定される。FREE_UNTIL_24H / 48H は開始の 24 / 48 時間前まで全額返金、NONE は返金なし。 */
        CancellationPolicy: {
            /** @enum {string} */
            code: "FREE_UNTIL_24H" | "FREE_UNTIL_48H" | "NONE";
            /** @enum {integer|null} */
            freeCancellationHoursBefore: 24 | 48 | null;
        };
        /** @description 答えた質問だけを送る。記述式は text、選択式は optionIds。 */
        CheckoutAnswer: {
            optionIds?: string[];
            questionId: string;
            text?: string;
        };
        CheckoutConsent: {
            agreedVersion: string;
        };
        /** @enum {string} */
        CheckoutErrorCode: "VALIDATION_ERROR" | "INPUT_INVALID" | "CONSENT_OUTDATED" | "OCCURRENCE_INVALID" | "ANSWERS_INVALID" | "UNAVAILABLE" | "FULL" | "HOLD_LIMIT" | "REQUEST_MISMATCH" | "QUESTIONS_CHANGED" | "PRICE_CHANGED" | "RATE_LIMITED" | "CHECKOUT_UNAVAILABLE";
        ChildPricing: {
            /** @description 子どもだけの申込を受けない。 */
            adultRequired: boolean;
            maxAge: number;
            minAge: number;
            priceYen: number;
        };
        /**
         * @description 原稿の言語。v1 の体験サイトは EN の体験だけを掲載する。
         * @enum {string}
         */
        ContentLanguage: "EN" | "JA";
        DurationRange: {
            maxMinutes: number;
            minMinutes: number;
        };
        ExperienceAvailabilityResponse: {
            /**
             * Format: date-time
             * @description 残席を数えた時刻（UTC）。
             */
            generatedAt: string;
            occurrences: components["schemas"]["Occurrence"][];
            /** @enum {string} */
            timeZone: "Asia/Tokyo";
            /** @enum {integer} */
            windowDays: 90;
        };
        ExperienceCatalogResponse: {
            experiences: components["schemas"]["ExperienceSummary"][];
        };
        ExperienceCheckoutError: {
            code: components["schemas"]["CheckoutErrorCode"];
            /** @description PRICE_CHANGED のときの今の合計。 */
            currentTotalYen: number | null;
            /** @description INPUT_INVALID / ANSWERS_INVALID の項目（例: guestEmail, adultCount, answers.0.text）。 */
            field: string | null;
            /** @description 開発者向けの英語の説明。画面の文言は code から作る。 */
            message: string;
            /** @enum {string|null} */
            occurrenceReason: "NOT_SCHEDULED" | "CUTOFF" | "UNAVAILABLE" | null;
            questionId: string | null;
            /** @description 同じ clientRequestKey・同じ内容で、時間をおいて再送してよいか。 */
            retryable: boolean;
            seatsLeft: number | null;
        };
        ExperienceCheckoutErrorResponse: {
            error: components["schemas"]["ExperienceCheckoutError"];
        };
        /** @description 旅行者本人の入力。URL・ログ・計測・storage へ複製しない。 */
        ExperienceCheckoutRequest: {
            adultCount: number;
            answers?: components["schemas"]["CheckoutAnswer"][];
            bookingQuestionsFingerprint: string;
            childCount: number;
            /** @description 申込の試行ごとの乱数（UUID v4 推奨）。通信失敗の再送は同じ値、内容を変えたら新しい値。 */
            clientRequestKey: string;
            consent: components["schemas"]["CheckoutConsent"];
            /** @description 画面に表示した合計。NIHO の計算と違えば 409 PRICE_CHANGED（請求額は NIHO が決め、この値では決めない）。 */
            expectedTotalYen: number;
            guestEmail: string;
            guestName: string;
            note?: string | null;
            occurrenceDate: components["schemas"]["LocalDate"];
            offerId: components["schemas"]["OfferId"];
        };
        ExperienceCheckoutResponse: {
            /** @description 遷移先。https://checkout.stripe.com/ または NIHO の予約確認ページ（決済済みの再送）。それ以外の URL なら遷移しない。 */
            checkoutUrl: string;
        };
        ExperienceDetail: {
            booking: components["schemas"]["BookingTerms"];
            /** @description 検索エンジン向けの正規 URL（NIHO が決める）。体験サイトは link rel=canonical にそのまま使う。 */
            canonicalUrl: string;
            contentLanguage: components["schemas"]["ContentLanguage"];
            cover: components["schemas"]["PublicImage"] | null;
            /** @description プレーンテキスト。段落は空行区切り。HTML・Markdown として解釈しない。 */
            description: string;
            highlights: string[];
            hosts: components["schemas"]["Host"][];
            included: string[];
            knowBeforeYouGo: string[];
            /** @description 当日の言語（提供者の記述。例: English & Japanese）。 */
            languageNote: string;
            lead: string;
            meetingPoint: components["schemas"]["MeetingPoint"] | null;
            /**
             * @description AFTER_BOOKING のときは集合場所を出さず「予約確定後に案内」と伝える。
             * @enum {string}
             */
            meetingPointDisclosure: "PUBLIC" | "AFTER_BOOKING";
            notIncluded: string[];
            notSuitableFor: string[];
            offers: components["schemas"]["ExperienceOffer"][];
            photos: components["schemas"]["PublicImage"][];
            provider: components["schemas"]["Provider"];
            region: components["schemas"]["Region"];
            seller: components["schemas"]["Seller"];
            slug: components["schemas"]["ExperienceSlug"];
            timeline: components["schemas"]["TimelineItem"][];
            title: string;
            /** Format: date-time */
            updatedAt: string;
        };
        ExperienceDetailResponse: {
            experience: components["schemas"]["ExperienceDetail"];
        };
        ExperienceOffer: {
            /**
             * @description INSTANT は決済で確定。APPROVAL はカードの仮押さえ後に提供者が承認して確定（承認されなければ請求しない）。
             * @enum {string}
             */
            acceptanceMode: "INSTANT" | "APPROVAL";
            bookingQuestions: components["schemas"]["BookingQuestion"][];
            /** @description 質問の組の SHA-256。checkout へそのまま送る。 */
            bookingQuestionsFingerprint: string;
            cancellationPolicy: components["schemas"]["CancellationPolicy"];
            /** @description 1 回の定員。 */
            capacity: number;
            durationMinutes: number;
            id: components["schemas"]["OfferId"];
            /** @description 1 組の上限人数。 */
            maxPartySize: number;
            /** @description 1 組の最少人数。 */
            minimumParticipants: number;
            name: string;
            pricing: components["schemas"]["OfferPricing"];
            shortDescription: string | null;
            startTime: components["schemas"]["LocalTime"];
            /** @description 開催する曜日（0=日 … 6=土）。表示の要約用。実際の開催回は availability。 */
            weekdays: number[];
        };
        /** @description 英小文字・数字・ハイフン（連続しない）。掲載後は変わらない。 */
        ExperienceSlug: string;
        ExperienceSummary: {
            contentLanguage: components["schemas"]["ContentLanguage"];
            cover: components["schemas"]["PublicImage"] | null;
            duration: components["schemas"]["DurationRange"];
            lead: string;
            priceFrom: components["schemas"]["PriceFrom"];
            provider: components["schemas"]["ProviderSummary"];
            region: components["schemas"]["Region"];
            slug: components["schemas"]["ExperienceSlug"];
            title: string;
            /**
             * Format: date-time
             * @description 公開本文・商品条件の最終更新（UTC）。sitemap の lastmod に使える。
             */
            updatedAt: string;
        };
        /** @description 迎える人。表示名と顔写真だけ。 */
        Host: {
            avatar: components["schemas"]["PublicImage"] | null;
            displayName: string;
        };
        LegalDocument: {
            /** @enum {string} */
            kind: "TERMS" | "PRIVACY" | "COMMERCIAL_TRANSACTIONS";
            /** @description NIHO が用意する https URL。 */
            url: string;
        };
        /** @description 日本時間（Asia/Tokyo）の日付 `YYYY-MM-DD`。 */
        LocalDate: string;
        /** @description 日本時間（Asia/Tokyo）の時刻 `HH:mm`。 */
        LocalTime: string;
        /** @description 集合場所を公開してよい体験だけに入る。 */
        MeetingPoint: {
            accessNote: string | null;
            address: string | null;
            entranceNote: string | null;
            exteriorPhotoIndex: number | null;
            /** @description 地図サービスへの https リンク。 */
            mapUrl: string | null;
            name: string;
        };
        Occurrence: {
            bookable: boolean;
            date: components["schemas"]["LocalDate"];
            /** Format: date-time */
            endAt: string;
            offerId: components["schemas"]["OfferId"];
            /**
             * @description 予約できない理由。bookable が true なら null。CUTOFF は締切後、FULL は満席、UNAVAILABLE は受付停止・休業等。
             * @enum {string|null}
             */
            reason: "CUTOFF" | "FULL" | "UNAVAILABLE" | null;
            seatsLeft: number;
            /**
             * Format: date-time
             * @description UTC。表示は Asia/Tokyo に換算する。
             */
            startAt: string;
        };
        /** @description 商品の不透明な ID。形を解釈しない。 */
        OfferId: string;
        /** @description 1 人あたりの料金（税込・円）。合計 = 大人 × adultPriceYen + 子ども × child.priceYen。追加料金は無い。 */
        OfferPricing: {
            adultPriceYen: number;
            /** @description 子ども料金が無い商品は null（子どもの申込を受けない）。 */
            child: components["schemas"]["ChildPricing"] | null;
            /** @enum {string} */
            currency: "JPY";
            /** @enum {boolean} */
            taxIncluded: true;
        };
        /** @description 掲載中の商品の大人 1 人の料金の最小値。 */
        PriceFrom: {
            amountYen: number;
            /** @enum {boolean} */
            taxIncluded: true;
            /** @enum {string} */
            unit: "PER_ADULT";
        };
        Provider: {
            kind: components["schemas"]["ProviderKind"];
            logo: components["schemas"]["PublicImage"] | null;
            name: string;
            tagline: string | null;
        };
        /**
         * @description 体験を提供する人・場の種類。SPOT は NIHO の拠点、INDIVIDUAL は個人、BUSINESS は店舗・事業者。
         * @enum {string}
         */
        ProviderKind: "SPOT" | "INDIVIDUAL" | "BUSINESS";
        ProviderSummary: {
            kind: components["schemas"]["ProviderKind"];
            name: string;
        };
        PublicError: {
            /** @enum {string} */
            code: "VALIDATION_ERROR";
            message: string;
        };
        PublicErrorResponse: {
            error: components["schemas"]["PublicError"];
        };
        PublicImage: {
            /** @description EXIF 等を除いた公開用の派生画像（https）。少なくとも応答から 1 時間は有効。永続化・再配信しない。 */
            url: string;
        };
        Region: {
            key: components["schemas"]["RegionKey"];
            name: string;
        };
        RegionKey: string;
        /** @description 決済上の販売者（契約の相手）。体験サイトの運営者・サポート窓口と混同して表示しない。 */
        Seller: {
            displayName: string;
            /** @description 特定商取引法に基づく表示（NIHO が用意する https URL）。 */
            legalNoticeUrl: string;
        };
        TimelineItem: {
            /** @description `photos[]` の位置。写真なしは null。 */
            photoIndex: number | null;
            text: string;
            /** @description `HH:mm`（日本時間）または空文字（時刻なし）。 */
            time: string;
            title: string;
        };
    };
    responses: {
        /** @description 申込を受け付けなかった。席も申込も作っていない（REQUEST_MISMATCH を除き、同じ内容で再送しても結果は変わらない）。 */
        CheckoutError: {
            headers: {
                "Cache-Control": components["headers"]["NoStoreCacheControl"];
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ExperienceCheckoutErrorResponse"];
            };
        };
        /** @description 掲載中でない（不存在・下書き・停止・非公開を区別しない）。本文は無い。 */
        NotFound: {
            headers: {
                "Cache-Control": components["headers"]["NoStoreCacheControl"];
                [name: string]: unknown;
            };
            content?: never;
        };
        /** @description path / query の形が不正。 */
        ValidationError: {
            headers: {
                "Cache-Control": components["headers"]["NoStoreCacheControl"];
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["PublicErrorResponse"];
            };
        };
    };
    parameters: {
        /** @description 体験サイトでの体験の slug（NIHO の拠点 slug・ページ slug とは別）。 */
        ExperienceSlug: components["schemas"]["ExperienceSlug"];
    };
    requestBodies: never;
    headers: {
        /** @description `no-store`。キャッシュ・CDN・ISR に載せない。 */
        NoStoreCacheControl: string;
        /** @description 共有キャッシュしてよい公開投影。`public, max-age=60, stale-while-revalidate=300` を上限とする。 */
        SharedCacheControl: string;
    };
    pathItems: never;
};
export type $defs = Record<string, never>;
export interface operations {
    listExperiences: {
        parameters: {
            query?: {
                /** @description 地域キー。省略時は全地域。 */
                region?: components["schemas"]["RegionKey"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 掲載中の体験の一覧（0 件のときは空配列）。 */
            200: {
                headers: {
                    "Cache-Control": components["headers"]["SharedCacheControl"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ExperienceCatalogResponse"];
                };
            };
            400: components["responses"]["ValidationError"];
        };
    };
    getExperience: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 体験サイトでの体験の slug（NIHO の拠点 slug・ページ slug とは別）。 */
                experienceSlug: components["parameters"]["ExperienceSlug"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 体験の詳細。 */
            200: {
                headers: {
                    "Cache-Control": components["headers"]["SharedCacheControl"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ExperienceDetailResponse"];
                };
            };
            400: components["responses"]["ValidationError"];
            404: components["responses"]["NotFound"];
        };
    };
    getExperienceAvailability: {
        parameters: {
            query?: {
                /** @description 商品を絞る。省略時は全商品。 */
                offerId?: components["schemas"]["OfferId"];
            };
            header?: never;
            path: {
                /** @description 体験サイトでの体験の slug（NIHO の拠点 slug・ページ slug とは別）。 */
                experienceSlug: components["parameters"]["ExperienceSlug"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 開催回の一覧。 */
            200: {
                headers: {
                    "Cache-Control": components["headers"]["NoStoreCacheControl"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ExperienceAvailabilityResponse"];
                };
            };
            400: components["responses"]["ValidationError"];
            404: components["responses"]["NotFound"];
        };
    };
    startExperienceCheckout: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 体験サイトでの体験の slug（NIHO の拠点 slug・ページ slug とは別）。 */
                experienceSlug: components["parameters"]["ExperienceSlug"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ExperienceCheckoutRequest"];
            };
        };
        responses: {
            /** @description 仮押さえ済み。`checkoutUrl` へ遷移する。同じ `clientRequestKey` と同じ内容の再送も同じ URL を返す。 */
            201: {
                headers: {
                    "Cache-Control": components["headers"]["NoStoreCacheControl"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ExperienceCheckoutResponse"];
                };
            };
            400: components["responses"]["CheckoutError"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["CheckoutError"];
            422: components["responses"]["CheckoutError"];
            /** @description IP ごとの申込回数の上限。`Retry-After` 秒後に再試行できる。 */
            429: {
                headers: {
                    "Cache-Control": components["headers"]["NoStoreCacheControl"];
                    /** @description 再試行できるまでの秒数。 */
                    "Retry-After"?: number;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ExperienceCheckoutErrorResponse"];
                };
            };
            503: components["responses"]["CheckoutError"];
        };
    };
}
