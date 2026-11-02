# Belge Dizini

Bu klasör projenin iç/geliştirme belgelerini içerir ve `.gitignore` gereği remote'a yayımlanmaz (kök `README.md` hariç tüm `*.md` dosyaları yoksayılır). Belgeler Türkçe tutulur.

Son toplu doğrulama: **2026-09-16** (tüm repository kaynak taraması).

## Okuma sırası

| #   | Belge                                  | İçerik                                                            |
| --- | -------------------------------------- | ----------------------------------------------------------------- |
| 1   | [../AGENTS.md](../AGENTS.md)           | Yapay zekâ ajanları için zorunlu kurallar ve mevcut aşama         |
| 2   | [PROJECT.md](PROJECT.md)               | Ürün, kapsam, aşamalar ve mevcut durum                            |
| 3   | [BUSINESS_RULES.md](BUSINESS_RULES.md) | KPI iş kuralları — **yetkili kaynak**, büyük kısmı henüz şartname |
| 4   | [ARCHITECTURE.md](ARCHITECTURE.md)     | Modüller, sınırlar, dosya/auth akışları, ölçekleme kısıtları      |

## Göreve göre

| Belge                                      | Ne zaman okunur                                              |
| ------------------------------------------ | ------------------------------------------------------------ |
| [API.md](API.md)                           | Endpoint ekleme/değiştirme, sözleşme sorusu                  |
| [DATABASE.md](DATABASE.md)                 | Şema, migration, indeks, ERP view çalışması                  |
| [WEB.md](WEB.md)                           | `apps/web` içinde herhangi bir değişiklik                    |
| [UI_GUIDELINES.md](UI_GUIDELINES.md)       | Yeni ekran/bileşen, mobil öncelik ve yerelleştirme kuralları |
| [DOCKER.md](DOCKER.md)                     | Compose, image, port, ortam değişkeni, n8n runtime           |
| [N8N.md](N8N.md)                           | n8n workflow'ları: her akşamki KPI maili (`n8n/kpi-mail-send`) |
| [TIGER_DATA.md](TIGER_DATA.md)             | Tiger kaynağı, okunan tablo/alanlar, KPI ölçümlerinin hesabı |
| [REPORTS.md](REPORTS.md)                   | KPI hedef öneri raporları (`report_<KPI kodu>` view'ları); başka Tiger kurulumu için `sql/kpi-report-views.sql` |
| [DECISIONS.md](DECISIONS.md)               | Kalıcı mimari kararlar (ADR-001…ADR-069)                     |
| [AUDIT-2026-09-16.md](AUDIT-2026-09-16.md) | Bilinen kod/belge tutarsızlıkları ve açık teknik borç        |
| [CHANGELOG.md](CHANGELOG.md)               | Tarih bazlı değişiklik günlüğü                               |
| [AI_GUIDE.md](AI_GUIDE.md)                 | Görev yöntemi ve kontrol listesi                             |
| [KPI_TARGET_ADVISOR.md](KPI_TARGET_ADVISOR.md) | İngilizce; işletme sahibinin bir AI sohbetine yapıştırdığı hedef danışmanı: 16 KPI'ın hesabı, puan/maaş, role göre şablon ve hedef önerisi. KPI kuralı, puan ya da öneri formülü değişince güncellenir |

## Bakım kuralı

İş davranışı, mimari, şema, API, yapılandırma veya dağıtım değiştiğinde ilgili belge **aynı görevde** güncellenir. Kalıcı bir mimari karar alındıysa `DECISIONS.md`'ye yeni bir ADR eklenir ve `CHANGELOG.md`'ye giriş yazılır. `AUDIT-*.md` içindeki bir madde çözüldüğünde listeden düşürülür.

Kod ile belge çeliştiğinde **kod esastır**; belge aynı görevde düzeltilir.
