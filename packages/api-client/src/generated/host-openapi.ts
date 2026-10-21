// このファイルは scripts/gen-types.ts が contract/experience-host-api.openapi.json から生成する。手で編集しない。
// 更新: npm -C packages/api-client run gen:types
export type paths = {
    "/api/auth/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** 自分のユーザー情報・所属情報を取得 */
        get: operations["getAuthMe"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/experience-providers": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 自分が所属する体験の提供者の一覧
         * @description ログイン中の本人が OWNER / EDITOR として所属する提供者を、登録の古い順に 200 件まで返す（platform ADMIN は全提供者）。
         *     `memberRole` は本人の役割（platform ADMIN で所属していなければ null）。`consent` は提供者の登録の同意、
         *     `paymentReuseConsent` は既存の拠点の販売者口座を売上の受取に再利用するときの同意（版と画面に出す文言）。
         */
        get: operations["listExperienceProviders"];
        put?: never;
        /**
         * 体験の提供者として自己登録する
         * @description 本人を OWNER とする提供者を作る（招待はない）。登録直後の審査の状態は `DRAFT`。
         *     `consentVersion` は一覧・詳細の `consent.version` と一致が必須。予約の通知先には本人の認証のメール（無ければアカウントの登録メール）を使う。
         *     422 の `error.details.reason`: `PROVIDER_CONSENT_OUTDATED`（同意の版が古い）・`PROVIDER_EMAIL_REQUIRED`（通知先のメールが無い）。
         */
        post: operations["registerExperienceProvider"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/experience-providers/{providerId}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 提供者の ID（`ExperienceProvider.id`） */
                providerId: components["parameters"]["ExperienceProviderId"];
            };
            cookie?: never;
        };
        /**
         * 体験の提供者の紹介を読む
         * @description OWNER / EDITOR（platform ADMIN は全提供者）が読む。所属していない・存在しない提供者は区別せず 404。
         *     `provider` は読む間に消えたときだけ null。
         */
        get: operations["getExperienceProvider"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * 体験の提供者の紹介を直す
         * @description OWNER / EDITOR（platform ADMIN）が紹介を直す。`sellerDisclosureUrl` を含む変更は OWNER と platform ADMIN だけで、EDITOR は 403。
         *     直すと、審査が `APPROVED` / `SUSPENDED` の提供者は `REQUESTED`（再審査）に戻り、掲載中の体験は止まる（`PAUSED`）。
         *     項目が 1 つも無い本文・知らない項目は 400。所属していない・存在しない提供者は 404。
         */
        patch: operations["updateExperienceProvider"];
        trace?: never;
    };
    "/api/experience-providers/{providerId}/payments/connect/resume": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 提供者の ID（`ExperienceProvider.id`） */
                providerId: components["parameters"]["ExperienceProviderId"];
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 売上の受取口座の Stripe の接続を続ける
         * @description `start` と同じ処理（リンクの期限が切れた・Stripe の画面を途中で離れたときに、新しいリンクを受け取る）。応答・エラーも `start` と同じ。
         */
        post: operations["resumeExperienceProviderPaymentConnect"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/experience-providers/{providerId}/payments/connect/start": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 提供者の ID（`ExperienceProvider.id`） */
                providerId: components["parameters"]["ExperienceProviderId"];
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 売上の受取口座の Stripe の接続を始める
         * @description 提供者の OWNER が、Stripe の口座の登録の画面（アカウントリンク）の URL を受け取る。口座が無ければ作る（同じ提供者では冪等）。本文は読まない。
         *     `url` は一度きりで `expiresAt` まで。Stripe から戻る先（`refresh_url` / `return_url`）は API の設定で決まり、体験サイトのホストの画面
         *     （env `EXPERIENCE_HOST_CONSOLE_URL`）があれば `<その URL>?providerId=…&connect=refresh|return`、無ければ niho.life の提供者の画面。
         *     応答には準備の状態（`ready` / `reason`）も入る。
         *     404: 提供者の OWNER でない（platform ADMIN でも OWNER でなければ 404）。409: 決済の接続を使えない（`PROVIDER_CONNECT_UNAVAILABLE`）・
         *     拠点の口座を再利用している（`PROVIDER_PAYMENT_SHARED_ACCOUNT`）・口座が無いまま申込がある（`PROVIDER_PAYMENT_LOCKED`）。
         *     理由は `error.details.reason` に入る。
         */
        post: operations["startExperienceProviderPaymentConnect"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/experience-providers/{providerId}/payments/connect/sync": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 提供者の ID（`ExperienceProvider.id`） */
                providerId: components["parameters"]["ExperienceProviderId"];
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 売上の受取口座の状態を Stripe から取り直す
         * @description 提供者の OWNER が、Stripe の口座の状態を取り直して保存し、準備の状態を返す（`url` / `expiresAt` は null）。本文は読まない。
         *     404 と 409 は `start` と同じで、加えて口座がまだ無ければ 409（`PROVIDER_PAYMENT_NOT_CONNECTED`）。
         */
        post: operations["syncExperienceProviderPaymentConnect"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/experience-providers/{providerId}/payments/readiness": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 提供者の ID（`ExperienceProvider.id`） */
                providerId: components["parameters"]["ExperienceProviderId"];
            };
            cookie?: never;
        };
        /**
         * 体験の提供者の売上の受取口座の準備の状態
         * @description OWNER（platform ADMIN）が、売上の受取口座（Stripe の連結アカウント）の準備の状態を読む。口座の ID・本人確認の項目は返さない。
         *     EDITOR・所属していない提供者は 404。
         */
        get: operations["getExperienceProviderPaymentReadiness"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/experience-providers/{providerId}/payments/reuse": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 提供者の ID（`ExperienceProvider.id`） */
                providerId: components["parameters"]["ExperienceProviderId"];
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 拠点の販売者口座を体験の売上の受取に再利用する
         * @description 提供者の OWNER が、自分が現役の OWNER である拠点（`sourceSpotId`）の準備済みの販売者口座を、この提供者の売上の受取に共有する。
         *     拠点の側の口座・設定は変えない。掲載中の体験は止まる（`PAUSED`）。`consentVersion` は `paymentReuseConsent.version` と一致が必須。
         *     404: 提供者の OWNER でない（platform ADMIN でも OWNER でなければ 404）・`sourceSpotId` の OWNER でない・拠点に口座が無い
         *     （`PROVIDER_PAYMENT_SOURCE_FORBIDDEN`）。409: 申込が 1 件でもある（`PROVIDER_PAYMENT_LOCKED`）。
         *     422: 同意の版が古い（`PROVIDER_PAYMENT_CONSENT_OUTDATED`）・拠点の口座の準備が済んでいない（`PROVIDER_PAYMENT_SOURCE_NOT_READY`）。
         *     理由は `error.details.reason` に入る。
         */
        post: operations["reuseExperienceProviderPayment"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/experience-providers/{providerId}/payments/reuse-candidates": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 提供者の ID（`ExperienceProvider.id`） */
                providerId: components["parameters"]["ExperienceProviderId"];
            };
            cookie?: never;
        };
        /**
         * 売上の受取に再利用できる拠点の販売者口座の候補
         * @description OWNER（platform ADMIN）が読む。本人が現役の OWNER である通常の拠点ごとに、その販売者口座の準備の状態を返す
         *     （`ready: true` の拠点だけ再利用できる）。EDITOR・所属していない提供者は 404。
         */
        get: operations["listExperienceProviderPaymentReuseCandidates"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/experience-providers/{providerId}/submit": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 提供者の ID（`ExperienceProvider.id`） */
                providerId: components["parameters"]["ExperienceProviderId"];
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 体験の提供者の審査を申請する
         * @description OWNER（platform ADMIN）が NIHO の審査を申請する。本文は読まない。審査が `DRAFT` / `REQUESTED` で、`sellerDisclosureUrl`（https）があり、
         *     登録の同意が今の版のときだけ `REQUESTED` にする。それ以外は 409（`error.details.reason`: `PROVIDER_REVIEW_STATE_CONFLICT`）。
         *     EDITOR・所属していない提供者は 404。
         */
        post: operations["submitExperienceProvider"];
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
        ErrorResponse: {
            error: {
                /** @description エラーコード（実装の `ErrorCode` に準拠） */
                code: ("BODY_JSON_TOO_LARGE" | "BODY_JSON_INVALID" | "MEMBER_BLOCK_INVALID" | "MEMBER_BLOCK_CROSS_SPOT_FORBIDDEN") | string;
                details: {
                    [key: string]: unknown;
                };
                message: string;
            };
        };
        /**
         * @description 体験サイトのホストの画面が `GET /api/auth/me` から読む部分（表示名と顔写真）。応答の正は `AuthMeResponse` で、ほかの項目も入る
         *     （この schema は閉じない）。ホストの契約の書き出しでは、`getAuthMe` の 200 の schema をこれに置き換える。
         *     項目を足すときは `AuthMeResponse` に同じ名前・同じ型の項目があることを確かめる（contracts の test が見る）。
         */
        ExperienceHostAuthMe: {
            user: {
                displayName: string | null;
                id: string;
            };
            /** @description プロフィールの顔写真（短命の署名つき URL）。未設定は null */
            userIconImage: {
                /** Format: date-time */
                expiresAt: string;
                signedUrl: string;
            } | null;
        };
        /** @description 体験の提供者（本人が読む形） */
        ExperienceProvider: {
            /** Format: date-time */
            approvedAt: string | null;
            bio: string;
            /** Format: date-time */
            consentedAt: string;
            /** @description 登録で同意した版 */
            consentVersion: string;
            /** Format: date-time */
            createdAt: string;
            displayName: string;
            id: string;
            kind: components["schemas"]["ExperienceProviderKind"];
            /** @description 登録した人の user ID（記録だけで、権限の根拠にしない。権限は memberRole） */
            ownerUserId: string;
            /** Format: date-time */
            paymentReuseConsentedAt: string | null;
            /** @description 拠点の販売者口座の再利用に同意した版（再利用していなければ null） */
            paymentReuseConsentVersion: string | null;
            /** @description 売上の受取に口座を共有している拠点の ID（再利用していなければ null） */
            paymentReuseSourceSpotId: string | null;
            reviewStatus: components["schemas"]["ExperienceProviderReviewStatus"];
            /** @description 提供者が管理する特定商取引法の表示ページ（https）。未設定は null で、審査を申請できない */
            sellerDisclosureUrl: string | null;
            /**
             * Format: date-time
             * @description 審査を最後に申請した時刻
             */
            submittedAt: string | null;
            /** Format: date-time */
            updatedAt: string;
            /** @description 提供者の体験・予約・売上を入れる内部の器（拠点）の ID。通常の拠点の API の権限は持たない */
            vesselSpotId: string;
        };
        /** @description 同意の版と、画面に出す同意の文言（版と対応）。送るときは `version` をそのまま返す */
        ExperienceProviderConsent: {
            text: string;
            version: string;
        };
        ExperienceProviderDetailResponse: {
            consent: components["schemas"]["ExperienceProviderConsent"];
            paymentReuseConsent: components["schemas"]["ExperienceProviderConsent"];
            /** @description 本人が platform ADMIN か */
            platformAdmin: boolean;
            provider: components["schemas"]["ExperienceProviderWithMemberRole"] | null;
        };
        /**
         * @description 提供者の種別（個人 / 事業者）。Stripe の口座の種別にも使う
         * @enum {string}
         */
        ExperienceProviderKind: "INDIVIDUAL" | "BUSINESS";
        ExperienceProviderListResponse: {
            consent: components["schemas"]["ExperienceProviderConsent"];
            paymentReuseConsent: components["schemas"]["ExperienceProviderConsent"];
            /** @description 本人が platform ADMIN か（全提供者を読める） */
            platformAdmin: boolean;
            providers: components["schemas"]["ExperienceProviderWithMemberRole"][];
        };
        /**
         * @description 提供者の中での本人の役割。EDITOR は紹介と原稿だけを直せる（予約・顧客・売上・受取口座・掲載の申請・審査の申請は OWNER だけ）。
         * @enum {string}
         */
        ExperienceProviderMemberRole: "OWNER" | "EDITOR";
        ExperienceProviderPaymentConnectResponse: {
            /**
             * Format: date-time
             * @description `url` の期限。`sync` では null
             */
            expiresAt: string | null;
            /** @description `reason` が `READY` のときだけ true */
            ready: boolean;
            reason: components["schemas"]["ExperienceProviderPaymentReadinessReason"];
            /** @description Stripe の口座の登録の画面（一度きり）。`sync` では null */
            url: string | null;
        };
        /**
         * @description 受取口座の準備の状態。`NOT_CONNECTED`（口座が無い）・`VERIFICATION_REQUIRED`（本人確認・提出が済んでいない）・
         *     `CHARGES_DISABLED`（決済を受けられない）・`PAYOUTS_DISABLED`（入金を受けられない）・`RESTRICTED`（制限・停止・設定の不整合）・`READY`。
         * @enum {string}
         */
        ExperienceProviderPaymentReadinessReason: "NOT_CONNECTED" | "VERIFICATION_REQUIRED" | "CHARGES_DISABLED" | "PAYOUTS_DISABLED" | "RESTRICTED" | "READY";
        ExperienceProviderPaymentReadinessResponse: {
            paymentReuseConsent: components["schemas"]["ExperienceProviderConsent"];
            /** @description `reason` が `READY` のときだけ true */
            ready: boolean;
            reason: components["schemas"]["ExperienceProviderPaymentReadinessReason"];
        };
        /** @description 本人が現役の OWNER である通常の拠点と、その販売者口座の準備の状態 */
        ExperienceProviderPaymentReuseCandidate: {
            /** @description 拠点の ID（再利用の `sourceSpotId`） */
            id: string;
            name: string;
            /** @description `reason` が `READY` のときだけ true */
            ready: boolean;
            reason: components["schemas"]["ExperienceProviderPaymentReadinessReason"];
        };
        ExperienceProviderPaymentReuseCandidatesResponse: {
            paymentReuseConsent: components["schemas"]["ExperienceProviderConsent"];
            spots: components["schemas"]["ExperienceProviderPaymentReuseCandidate"][];
        };
        ExperienceProviderPaymentReuseRequest: {
            /** @description `paymentReuseConsent.version` */
            consentVersion: string;
            /** @description 再利用する拠点（候補の `id`） */
            sourceSpotId: string;
        };
        /** @description 提供者の自己登録。前後の空白は除いてから長さを見る */
        ExperienceProviderRegisterRequest: {
            bio: string;
            /** @description 一覧・詳細の `consent.version` */
            consentVersion: string;
            displayName: string;
            kind: components["schemas"]["ExperienceProviderKind"];
            /** @description 特定商取引法の表示ページ。https の URL（ユーザー名・パスワードを含まない）。後で設定するなら null */
            sellerDisclosureUrl: string | null;
        };
        ExperienceProviderRegisterResponse: {
            consent: components["schemas"]["ExperienceProviderConsent"];
            paymentReuseConsent: components["schemas"]["ExperienceProviderConsent"];
            provider: components["schemas"]["ExperienceProvider"];
        };
        ExperienceProviderResponse: {
            provider: components["schemas"]["ExperienceProvider"];
        };
        /**
         * @description NIHO の審査の状態。`DRAFT`（未申請）→ `REQUESTED`（申請中）→ `APPROVED`（承認）/ `SUSPENDED`（停止）。
         *     承認・停止の後に紹介を直すと `REQUESTED` に戻る。
         * @enum {string}
         */
        ExperienceProviderReviewStatus: "DRAFT" | "REQUESTED" | "APPROVED" | "SUSPENDED";
        ExperienceProviderSubmitResponse: {
            /** @enum {boolean} */
            submitted: true;
        };
        /** @description 紹介の変更（送った項目だけ変える。1 つ以上）。`sellerDisclosureUrl` は OWNER と platform ADMIN だけ */
        ExperienceProviderUpdateRequest: {
            bio?: components["schemas"]["ExperienceProviderRegisterRequest"]["bio"];
            displayName?: components["schemas"]["ExperienceProviderRegisterRequest"]["displayName"];
            sellerDisclosureUrl?: components["schemas"]["ExperienceProviderRegisterRequest"]["sellerDisclosureUrl"];
        };
        /** @description 体験の提供者と、その中での本人の役割（一覧・詳細）。項目は `ExperienceProvider` と同じで、`memberRole` が加わる */
        ExperienceProviderWithMemberRole: {
            approvedAt: components["schemas"]["ExperienceProvider"]["approvedAt"];
            bio: components["schemas"]["ExperienceProvider"]["bio"];
            consentedAt: components["schemas"]["ExperienceProvider"]["consentedAt"];
            consentVersion: components["schemas"]["ExperienceProvider"]["consentVersion"];
            createdAt: components["schemas"]["ExperienceProvider"]["createdAt"];
            displayName: components["schemas"]["ExperienceProvider"]["displayName"];
            id: components["schemas"]["ExperienceProvider"]["id"];
            kind: components["schemas"]["ExperienceProvider"]["kind"];
            /** @description 本人の役割（platform ADMIN で所属していなければ null） */
            memberRole: (string & components["schemas"]["ExperienceProviderMemberRole"]) | null;
            ownerUserId: components["schemas"]["ExperienceProvider"]["ownerUserId"];
            paymentReuseConsentedAt: components["schemas"]["ExperienceProvider"]["paymentReuseConsentedAt"];
            paymentReuseConsentVersion: components["schemas"]["ExperienceProvider"]["paymentReuseConsentVersion"];
            paymentReuseSourceSpotId: components["schemas"]["ExperienceProvider"]["paymentReuseSourceSpotId"];
            reviewStatus: components["schemas"]["ExperienceProvider"]["reviewStatus"];
            sellerDisclosureUrl: components["schemas"]["ExperienceProvider"]["sellerDisclosureUrl"];
            submittedAt: components["schemas"]["ExperienceProvider"]["submittedAt"];
            updatedAt: components["schemas"]["ExperienceProvider"]["updatedAt"];
            vesselSpotId: components["schemas"]["ExperienceProvider"]["vesselSpotId"];
        };
    };
    responses: {
        /** @description Conflict */
        Conflict: {
            headers: {
                "X-Request-Id": components["headers"]["XRequestId"];
                "X-Trace-Id": components["headers"]["XTraceId"];
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ErrorResponse"];
            };
        };
        /** @description Forbidden */
        Forbidden: {
            headers: {
                "X-Request-Id": components["headers"]["XRequestId"];
                "X-Trace-Id": components["headers"]["XTraceId"];
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ErrorResponse"];
            };
        };
        /** @description Not Found */
        NotFound: {
            headers: {
                "X-Request-Id": components["headers"]["XRequestId"];
                "X-Trace-Id": components["headers"]["XTraceId"];
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ErrorResponse"];
            };
        };
        /** @description Unauthorized */
        Unauthorized: {
            headers: {
                "X-Request-Id": components["headers"]["XRequestId"];
                "X-Trace-Id": components["headers"]["XTraceId"];
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ErrorResponse"];
            };
        };
        /** @description Unprocessable Entity */
        UnprocessableEntity: {
            headers: {
                "X-Request-Id": components["headers"]["XRequestId"];
                "X-Trace-Id": components["headers"]["XTraceId"];
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ErrorResponse"];
            };
        };
        /** @description Validation error */
        ValidationError: {
            headers: {
                "X-Request-Id": components["headers"]["XRequestId"];
                "X-Trace-Id": components["headers"]["XTraceId"];
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ErrorResponse"];
            };
        };
    };
    parameters: {
        /** @description 提供者の ID（`ExperienceProvider.id`） */
        ExperienceProviderId: string;
    };
    requestBodies: never;
    headers: {
        /**
         * @description API request correlation id.
         *     vX: API は全レスポンスで `X-Request-Id` を返す（client が付与した値を echo するか、server が生成）。
         */
        XRequestId: string;
        /**
         * @description Trace id for correlating Cloud Logging / Cloud Trace.
         *     vX: API は全レスポンスで `X-Trace-Id` を返す（32 hex を想定）。
         */
        XTraceId: string;
    };
    pathItems: never;
};
export type $defs = Record<string, never>;
export interface operations {
    getAuthMe: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ExperienceHostAuthMe"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
        };
    };
    listExperienceProviders: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ExperienceProviderListResponse"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
        };
    };
    registerExperienceProvider: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ExperienceProviderRegisterRequest"];
            };
        };
        responses: {
            /** @description 登録した */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ExperienceProviderRegisterResponse"];
                };
            };
            400: components["responses"]["ValidationError"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            422: components["responses"]["UnprocessableEntity"];
        };
    };
    getExperienceProvider: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 提供者の ID（`ExperienceProvider.id`） */
                providerId: components["parameters"]["ExperienceProviderId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ExperienceProviderDetailResponse"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
        };
    };
    updateExperienceProvider: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 提供者の ID（`ExperienceProvider.id`） */
                providerId: components["parameters"]["ExperienceProviderId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ExperienceProviderUpdateRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ExperienceProviderResponse"];
                };
            };
            400: components["responses"]["ValidationError"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
        };
    };
    resumeExperienceProviderPaymentConnect: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 提供者の ID（`ExperienceProvider.id`） */
                providerId: components["parameters"]["ExperienceProviderId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ExperienceProviderPaymentConnectResponse"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    startExperienceProviderPaymentConnect: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 提供者の ID（`ExperienceProvider.id`） */
                providerId: components["parameters"]["ExperienceProviderId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ExperienceProviderPaymentConnectResponse"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    syncExperienceProviderPaymentConnect: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 提供者の ID（`ExperienceProvider.id`） */
                providerId: components["parameters"]["ExperienceProviderId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ExperienceProviderPaymentConnectResponse"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    getExperienceProviderPaymentReadiness: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 提供者の ID（`ExperienceProvider.id`） */
                providerId: components["parameters"]["ExperienceProviderId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ExperienceProviderPaymentReadinessResponse"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
        };
    };
    reuseExperienceProviderPayment: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 提供者の ID（`ExperienceProvider.id`） */
                providerId: components["parameters"]["ExperienceProviderId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ExperienceProviderPaymentReuseRequest"];
            };
        };
        responses: {
            /** @description 再利用した */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ExperienceProviderResponse"];
                };
            };
            400: components["responses"]["ValidationError"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
            422: components["responses"]["UnprocessableEntity"];
        };
    };
    listExperienceProviderPaymentReuseCandidates: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 提供者の ID（`ExperienceProvider.id`） */
                providerId: components["parameters"]["ExperienceProviderId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ExperienceProviderPaymentReuseCandidatesResponse"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
        };
    };
    submitExperienceProvider: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description 提供者の ID（`ExperienceProvider.id`） */
                providerId: components["parameters"]["ExperienceProviderId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 申請した */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ExperienceProviderSubmitResponse"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
}
