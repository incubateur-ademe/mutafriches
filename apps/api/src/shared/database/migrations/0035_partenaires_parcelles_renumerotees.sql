-- Remplace les parcelles partenaires disparues du cadastre par leurs successeurs (ADR-0044).
-- Généré depuis apps/api/src/scripts/cadastre-successeurs/data/*.rapport.json.
UPDATE "partenaire_sites" SET "parcelles" = '["92025000B0203", "92025000B0206", "92025000B0259", "92025000B0253", "92025000B0254", "92025000B0299", "92025000B0302", "92025000B0303"]'::jsonb WHERE "partenaire_slug" = 'cci-92' AND "idtup" = 'uf920250027182' AND "origine" = 'seed';
--> statement-breakpoint
UPDATE "partenaire_sites" SET "parcelles" = '["92036000L0162", "92036000J0502", "92036000J0503", "92036000J0504", "92036000J0507", "92036000J0508", "92036000J0509", "92036000J0510", "92036000J0511", "92036000J0512", "92036000J0513", "92036000J0514", "92036000J0515", "92036000J0516", "92036000K0302", "92036000K0303", "92036000K0311", "92036000K0312", "92036000K0313"]'::jsonb WHERE "partenaire_slug" = 'cci-92' AND "idtup" = 'uf920360030903' AND "origine" = 'seed';
--> statement-breakpoint
UPDATE "partenaire_sites" SET "parcelles" = '["92036000J0010", "92036000J0247", "92036000K0080", "92036000K0083", "92036000J0488", "92036000J0489", "92036000J0490", "92036000J0491", "92036000J0492", "92036000J0493", "92036000J0494", "92036000J0495"]'::jsonb WHERE "partenaire_slug" = 'cci-92' AND "idtup" = 'uf920360029310' AND "origine" = 'seed';
--> statement-breakpoint
UPDATE "partenaire_sites" SET "parcelles" = '["92036000L0290", "92036000L0291", "92036000L0292"]'::jsonb WHERE "partenaire_slug" = 'cci-92' AND "idtup" = '920360000L0163' AND "origine" = 'seed';
--> statement-breakpoint
UPDATE "partenaire_sites" SET "parcelles" = '["92036000L0297", "92036000L0298", "92036000L0299", "92036000L0300", "92036000L0301"]'::jsonb WHERE "partenaire_slug" = 'cci-92' AND "idtup" = '920360000L0164' AND "origine" = 'seed';
--> statement-breakpoint
UPDATE "partenaire_sites" SET "parcelles" = '["92036000L0286", "92036000L0287"]'::jsonb WHERE "partenaire_slug" = 'cci-92' AND "idtup" = '920360000L0266' AND "origine" = 'seed';
--> statement-breakpoint
UPDATE "partenaire_sites" SET "parcelles" = '["49222000AB0248", "49222000AB0249", "49222000AB0250", "49222000AB0251", "49222000AB0252", "49222000AB0253", "49222000AB0254", "49222000AB0255", "49222000AB0256"]'::jsonb WHERE "partenaire_slug" = 'aura' AND "idtup" = '49222000AB0174' AND "origine" = 'seed';
--> statement-breakpoint
UPDATE "partenaire_sites" SET "parcelles" = '["77210000AH0014", "77210000AH0015", "77210000AH0016"]'::jsonb WHERE "partenaire_slug" = 'scet' AND "idtup" = 'scet-28' AND "origine" = 'seed';
--> statement-breakpoint
UPDATE "partenaire_sites" SET "parcelles" = '["77305000AM0394", "77305000AM0456", "77305000AM0457"]'::jsonb WHERE "partenaire_slug" = 'scet' AND "idtup" = 'scet-22' AND "origine" = 'seed';
--> statement-breakpoint
UPDATE "partenaire_sites" SET "parcelles" = '["77172000A0306", "77172000A0307", "77172000A0308", "77172000A0309", "77172000A0310", "77172000A0311", "77172000A1116", "77172000A1118", "77172000A1120", "77172000A1122", "77172000A1124", "77172000A1126", "77172000A1128", "77172000A1132", "77172000A1136", "77172000A1137", "77172000A1162", "77172000A1163"]'::jsonb WHERE "partenaire_slug" = 'scet' AND "idtup" = 'scet-19' AND "origine" = 'seed';
--> statement-breakpoint
UPDATE "partenaire_sites" SET "parcelles" = '["88009000AC0142", "88009000AC0294", "88009000AC0295", "88009000AC0296", "88009000AC0893", "88009000AC0894", "88009000AC0895", "88009000AC0896"]'::jsonb WHERE "partenaire_slug" = 'ddt-vosges' AND "idtup" = 'ddt88-355' AND "origine" = 'seed';
--> statement-breakpoint
UPDATE "partenaire_sites" SET "parcelles" = '["88012000AL0506", "88012000AL0508", "88012000AL0509", "88012000AL0514", "88012000AL0515", "88012000AL0516"]'::jsonb WHERE "partenaire_slug" = 'ddt-vosges' AND "idtup" = 'ddt88-120' AND "origine" = 'seed';
--> statement-breakpoint
UPDATE "partenaire_sites" SET "parcelles" = '["88250000AA0100", "88250000AA0102", "88250000AA0103", "88250000AA0104", "88250000AA0110", "88250000AA0111", "88250000AA0112", "88250000AA0113", "88250000AA0114", "88250000AA0115", "88250000AA0116"]'::jsonb WHERE "partenaire_slug" = 'ddt-vosges' AND "idtup" = 'ddt88-38' AND "origine" = 'seed';
--> statement-breakpoint
UPDATE "partenaire_sites" SET "parcelles" = '["88081000AH0051", "88081000AH0059", "88081000AH0060", "88081000AH0118", "88081000AH0119", "88081000AH0120", "88081000AH0123", "88081000AH0124"]'::jsonb WHERE "partenaire_slug" = 'ddt-vosges' AND "idtup" = 'ddt88-419' AND "origine" = 'seed';
--> statement-breakpoint
UPDATE "partenaire_sites" SET "parcelles" = '["88081000AE0282", "88081000AE0283"]'::jsonb WHERE "partenaire_slug" = 'ddt-vosges' AND "idtup" = 'ddt88-456' AND "origine" = 'seed';
--> statement-breakpoint
UPDATE "partenaire_sites" SET "parcelles" = '["88083000ZA0273", "88083000ZA0274"]'::jsonb WHERE "partenaire_slug" = 'ddt-vosges' AND "idtup" = 'ddt88-162' AND "origine" = 'seed';
--> statement-breakpoint
UPDATE "partenaire_sites" SET "parcelles" = '["88099000AE0183", "88099000AE0197", "88099000AL0154", "88099000AL0155", "88099000AL0176", "88099000AL0177", "88099000AL0178", "88099000AL0179", "88099000AL0188", "88099000AM0153", "88099000AR0057", "88099000AR0135", "88099000AR0138", "88099000AR0139", "88099000AR0140", "88099000AR0145", "88099000AR0148", "88099000AR0149", "88099000AR0150", "88099000AR0153", "88099000AR0155", "88099000AR0157", "88099000AR0159", "88099000AR0161", "88099000AR0162", "88099000AR0164", "88099000AR0167", "88099000AR0168"]'::jsonb WHERE "partenaire_slug" = 'ddt-vosges' AND "idtup" = 'ddt88-111' AND "origine" = 'seed';
--> statement-breakpoint
UPDATE "partenaire_sites" SET "parcelles" = '["88465000AY0064"]'::jsonb WHERE "partenaire_slug" = 'ddt-vosges' AND "idtup" = 'ddt88-27' AND "origine" = 'seed';
--> statement-breakpoint
UPDATE "partenaire_sites" SET "parcelles" = '["88096000AB0284", "88096000AB0293"]'::jsonb WHERE "partenaire_slug" = 'ddt-vosges' AND "idtup" = 'ddt88-81' AND "origine" = 'seed';
--> statement-breakpoint
UPDATE "partenaire_sites" SET "parcelles" = '["88135000AI0053", "88135000AI0117", "88135000AI0264", "88135000AI0266", "88135000AI0270", "88135000AI0284", "88135000AI0285", "88135000AI0286", "88135000AI0287", "88135000AI0288", "88135000AI0289", "88135000AI0290", "88135000AI0291"]'::jsonb WHERE "partenaire_slug" = 'ddt-vosges' AND "idtup" = 'ddt88-208' AND "origine" = 'seed';
--> statement-breakpoint
UPDATE "partenaire_sites" SET "parcelles" = '["88498000AD0002", "88498000AD0003"]'::jsonb WHERE "partenaire_slug" = 'ddt-vosges' AND "idtup" = 'ddt88-353' AND "origine" = 'seed';
--> statement-breakpoint
UPDATE "partenaire_sites" SET "parcelles" = '["88181000AI0398", "88181000AI0428", "88181000AI0431", "88181000AI0432"]'::jsonb WHERE "partenaire_slug" = 'ddt-vosges' AND "idtup" = 'ddt88-376' AND "origine" = 'seed';
--> statement-breakpoint
UPDATE "partenaire_sites" SET "parcelles" = '["88321000D0148", "88321000D0149", "88321000D0150", "88321000D0152", "88321000D0153", "88321000D0154", "88321000D0155", "88321000D0156", "88321000D0157", "88321000D0158", "88321000D0159", "88321000D0160", "88321000D0162", "88321000D0192", "88321000D0213", "88321000D0214", "88321000D0215", "88321000D0216", "88321000D0407", "88321000D0408", "88321000D0409", "88321000D0410"]'::jsonb WHERE "partenaire_slug" = 'ddt-vosges' AND "idtup" = 'ddt88-334' AND "origine" = 'seed';
--> statement-breakpoint
UPDATE "partenaire_sites" SET "parcelles" = '["88209000AH0163", "88209000AH0316", "88209000AH0319", "88209000AK0171", "88209000AK0172", "88209000AK0173", "88209000AK0212", "88209000AK0216", "88209000AK0226", "88209000AK0227"]'::jsonb WHERE "partenaire_slug" = 'ddt-vosges' AND "idtup" = 'ddt88-49' AND "origine" = 'seed';
--> statement-breakpoint
UPDATE "partenaire_sites" SET "parcelles" = '["88216000B0162", "88216000B0650", "88216000B0651", "88216000B0652", "88216000B0653", "88216000B0654"]'::jsonb WHERE "partenaire_slug" = 'ddt-vosges' AND "idtup" = 'ddt88-109' AND "origine" = 'seed';
--> statement-breakpoint
UPDATE "partenaire_sites" SET "parcelles" = '["88246000AC0093", "88246000AC0094", "88246000AC0116", "88246000ZB0089", "88246000ZB0090", "88246000ZB0091", "88246000ZB0092", "88246000AC0210", "88246000AC0211", "88246000AC0212", "88246000AC0213", "88246000AC0214", "88246000AC0215", "88246000AC0216", "88246000AC0217", "88246000AC0218", "88246000AC0219"]'::jsonb WHERE "partenaire_slug" = 'ddt-vosges' AND "idtup" = 'ddt88-24' AND "origine" = 'seed';
--> statement-breakpoint
UPDATE "partenaire_sites" SET "parcelles" = '["88261000AB0062", "88261000AB0063", "88261000AB0064", "88261000AB0065", "88261000AB0068", "88261000AB0070", "88261000AB0071", "88261000AB0075", "88261000AB0082", "88261000AB0083", "88261000AB0085", "88261000AB0086", "88261000AB0112", "88261000AB0123", "88261000AB0124", "88261000AB0125", "88261000AB0126", "88261000AB0127", "88261000AB0128", "88261000AB0129", "88261000AB0130", "88261000AB0131", "88261000AB0132", "88261000AB0133", "88261000AB0134", "88261000AB0135", "88261000AB0136", "88261000AB0137", "88261000AB0138"]'::jsonb WHERE "partenaire_slug" = 'ddt-vosges' AND "idtup" = 'ddt88-347' AND "origine" = 'seed';
--> statement-breakpoint
UPDATE "partenaire_sites" SET "parcelles" = '["88262000AE0067", "88262000AE0105", "88262000AE0108", "88262000AE0109", "88262000AE0110", "88262000AE0111"]'::jsonb WHERE "partenaire_slug" = 'ddt-vosges' AND "idtup" = 'ddt88-407' AND "origine" = 'seed';
--> statement-breakpoint
UPDATE "partenaire_sites" SET "parcelles" = '["88462000AO0075", "88462000AO0145", "88462000AO0146", "88462000AO0147"]'::jsonb WHERE "partenaire_slug" = 'ddt-vosges' AND "idtup" = 'ddt88-229' AND "origine" = 'seed';
--> statement-breakpoint
UPDATE "partenaire_sites" SET "parcelles" = '["88487000AI0019", "88487000AI0022", "88487000AI0118", "88487000AI0131", "88487000AI0132", "88487000AI0133", "88487000AI0299", "88487000AI0300", "88487000AI0325", "88487000AI0326", "88487000AI0327", "88487000AI0328", "88487000AI0329", "88487000AI0330", "88487000AI0331", "88487000AI0332", "88487000AI0333", "88487000AI0334", "88487000AI0335", "88487000AI0336", "88487000BT0376", "88487000BT0377", "88487000BT0378"]'::jsonb WHERE "partenaire_slug" = 'ddt-vosges' AND "idtup" = 'ddt88-301' AND "origine" = 'seed';
--> statement-breakpoint
UPDATE "partenaire_sites" SET "parcelles" = '["88270000ZN0033", "88270000ZN0073", "88270000ZN0082", "88270000ZN0084", "88270000ZN0114", "88270000ZN0116", "88270000ZN0117", "88270000ZN0118", "88270000ZN0119", "88270000ZN0120", "88270000ZN0121", "88270000ZN0122", "88270000ZN0123", "88270000ZN0124", "88270000ZN0125", "88270000ZN0126"]'::jsonb WHERE "partenaire_slug" = 'ddt-vosges' AND "idtup" = 'ddt88-250' AND "origine" = 'seed';
--> statement-breakpoint
UPDATE "partenaire_sites" SET "parcelles" = '["88281000C0650", "88281000C0904", "88281000C0905"]'::jsonb WHERE "partenaire_slug" = 'ddt-vosges' AND "idtup" = 'ddt88-423' AND "origine" = 'seed';
--> statement-breakpoint
UPDATE "partenaire_sites" SET "parcelles" = '["88313000E0348", "88313000E0432", "88313000E0433"]'::jsonb WHERE "partenaire_slug" = 'ddt-vosges' AND "idtup" = 'ddt88-318' AND "origine" = 'seed';
--> statement-breakpoint
UPDATE "partenaire_sites" SET "parcelles" = '["88321000AK0155", "88321000AK0156"]'::jsonb WHERE "partenaire_slug" = 'ddt-vosges' AND "idtup" = 'ddt88-373' AND "origine" = 'seed';
--> statement-breakpoint
UPDATE "partenaire_sites" SET "parcelles" = '["88349000E3086", "88349000E3474", "88349000E3475", "88349000E3476"]'::jsonb WHERE "partenaire_slug" = 'ddt-vosges' AND "idtup" = 'ddt88-394' AND "origine" = 'seed';
--> statement-breakpoint
UPDATE "partenaire_sites" SET "parcelles" = '["88351000AB0466", "88351000AB0468", "88351000AB0737", "88351000AB0789", "88351000AB0790"]'::jsonb WHERE "partenaire_slug" = 'ddt-vosges' AND "idtup" = 'ddt88-305' AND "origine" = 'seed';
--> statement-breakpoint
UPDATE "partenaire_sites" SET "parcelles" = '["88367000AM0328", "88367000AM0329", "88367000AM0330"]'::jsonb WHERE "partenaire_slug" = 'ddt-vosges' AND "idtup" = 'ddt88-176' AND "origine" = 'seed';
--> statement-breakpoint
UPDATE "partenaire_sites" SET "parcelles" = '["88372000B1480", "88372000B1481", "88372000B1523", "88372000B1524", "88372000B1776", "88372000B2049", "88372000B2050", "88372000B2051"]'::jsonb WHERE "partenaire_slug" = 'ddt-vosges' AND "idtup" = 'ddt88-119' AND "origine" = 'seed';
--> statement-breakpoint
UPDATE "partenaire_sites" SET "parcelles" = '["88413000A1108", "88413000A1202", "88413000A1214", "88413000A1215", "88413000A1216", "88413000A1217", "88413000A1218"]'::jsonb WHERE "partenaire_slug" = 'ddt-vosges' AND "idtup" = 'ddt88-25' AND "origine" = 'seed';
--> statement-breakpoint
UPDATE "partenaire_sites" SET "parcelles" = '["88413000AW0402", "88413000AW0419", "88413000AW0420"]'::jsonb WHERE "partenaire_slug" = 'ddt-vosges' AND "idtup" = 'ddt88-363' AND "origine" = 'seed';
--> statement-breakpoint
UPDATE "partenaire_sites" SET "parcelles" = '["88413000BM0019", "88413000BM0083", "88413000BM0084", "88413000BM0085", "88413000BM0094", "88413000BM0097", "88413000BM0100", "88413000BM0110", "88413000BM0111", "88413000BM0112", "88413000BM0113", "88413000BM0114", "88413000BM0117", "88413000BM0118", "88413000BM0119", "88413000BM0120", "88413000BM0121", "88413000BM0122", "88413000BM0123", "88413000BM0124", "88413000BM0125", "88413000BM0126", "88413000BM0127", "88413000BM0188", "88413000BM0189", "88413000BM0190", "88413000BM0191"]'::jsonb WHERE "partenaire_slug" = 'ddt-vosges' AND "idtup" = 'ddt88-437' AND "origine" = 'seed';
--> statement-breakpoint
UPDATE "partenaire_sites" SET "parcelles" = '["88413000AV0285", "88413000AV0290", "88413000AV0327", "88413000AV0330", "88413000AV0406", "88413000AV0407", "88413000AV0408", "88413000AV0409"]'::jsonb WHERE "partenaire_slug" = 'ddt-vosges' AND "idtup" = 'ddt88-90' AND "origine" = 'seed';
--> statement-breakpoint
UPDATE "partenaire_sites" SET "parcelles" = '["88426000AB0028", "88426000AB0338", "88426000AB0339", "88426000AB0340"]'::jsonb WHERE "partenaire_slug" = 'ddt-vosges' AND "idtup" = 'ddt88-225' AND "origine" = 'seed';
--> statement-breakpoint
UPDATE "partenaire_sites" SET "parcelles" = '["88426000AD0443", "88426000AD0444", "88426000AD0445", "88426000AD0446"]'::jsonb WHERE "partenaire_slug" = 'ddt-vosges' AND "idtup" = 'ddt88-58' AND "origine" = 'seed';
--> statement-breakpoint
UPDATE "partenaire_sites" SET "parcelles" = '["88429000AK0528"]'::jsonb WHERE "partenaire_slug" = 'ddt-vosges' AND "idtup" = 'ddt88-3' AND "origine" = 'seed';
--> statement-breakpoint
UPDATE "partenaire_sites" SET "parcelles" = '["88415000AO0036", "88415000AO0057", "88415000AO0247", "88415000AO0263", "88415000AO0264", "88415000AO0265", "88415000AO0269", "88415000AO0270"]'::jsonb WHERE "partenaire_slug" = 'ddt-vosges' AND "idtup" = 'ddt88-303' AND "origine" = 'seed';
--> statement-breakpoint
UPDATE "partenaire_sites" SET "parcelles" = '["88465000AW0090"]'::jsonb WHERE "partenaire_slug" = 'ddt-vosges' AND "idtup" = 'ddt88-23' AND "origine" = 'seed';
--> statement-breakpoint
UPDATE "partenaire_sites" SET "parcelles" = '["88498000AB0038", "88498000AC0023", "88498000AC0028", "88498000AC0029"]'::jsonb WHERE "partenaire_slug" = 'ddt-vosges' AND "idtup" = 'ddt88-165' AND "origine" = 'seed';
--> statement-breakpoint
UPDATE "partenaire_sites" SET "parcelles" = '["88498000AB0046"]'::jsonb WHERE "partenaire_slug" = 'ddt-vosges' AND "idtup" = 'ddt88-302' AND "origine" = 'seed';
--> statement-breakpoint
UPDATE "partenaire_sites" SET "parcelles" = '["88500000AB0498", "88500000AB0499"]'::jsonb WHERE "partenaire_slug" = 'ddt-vosges' AND "idtup" = 'ddt88-372' AND "origine" = 'seed';
--> statement-breakpoint
UPDATE "partenaire_sites" SET "parcelles" = '["88515000AB0404", "88515000ZB0049", "88515000AB0405", "88515000AB0406", "88515000AB0407", "88515000AB0408", "88515000AB0409", "88515000AB0410", "88515000AB0411", "88515000AB0412", "88515000AB0413", "88515000AB0414", "88515000AB0416"]'::jsonb WHERE "partenaire_slug" = 'ddt-vosges' AND "idtup" = 'ddt88-7' AND "origine" = 'seed';
--> statement-breakpoint
UPDATE "partenaire_sites" SET "parcelles" = '["88516000AL0021", "88516000AL0023", "88516000AL0392", "88516000AL0393"]'::jsonb WHERE "partenaire_slug" = 'ddt-vosges' AND "idtup" = 'ddt88-321' AND "origine" = 'seed';
--> statement-breakpoint
UPDATE "partenaire_sites" SET "parcelles" = '["88530000AB0496", "88530000AB0717", "88530000AB0718"]'::jsonb WHERE "partenaire_slug" = 'ddt-vosges' AND "idtup" = 'ddt88-233' AND "origine" = 'seed';
--> statement-breakpoint
UPDATE "partenaire_sites" SET "parcelles" = '["88530000BR0168"]'::jsonb WHERE "partenaire_slug" = 'ddt-vosges' AND "idtup" = 'ddt88-323' AND "origine" = 'seed';
--> statement-breakpoint
UPDATE "partenaire_sites" SET "parcelles" = '["88158000AK0021", "88158000AK0022", "88158000AK0023", "88158000AK0027", "88158000AK0028", "88158000AK0033", "88158000AK0035", "88158000AK0036", "88158000AK0196", "88158000AK0210", "88158000AK0211"]'::jsonb WHERE "partenaire_slug" = 'ddt-vosges' AND "idtup" = 'ddt88-210' AND "origine" = 'seed';
--> statement-breakpoint
UPDATE "partenaire_sites" SET "parcelles" = '["88160000AC0687", "88160000AC0688", "88160000AC0689"]'::jsonb WHERE "partenaire_slug" = 'ddt-vosges' AND "idtup" = 'ddt88-171' AND "origine" = 'seed';
--> statement-breakpoint
UPDATE "partenaire_sites" SET "parcelles" = '["88160000BM0011", "88160000BM0012", "88160000BM0014", "88160000BM0015", "88160000BM0016", "88160000BM0017", "88160000BM0018", "88160000BM0019", "88160000BM0022", "88160000BM0223", "88160000BM0225", "88160000BM0227", "88160000BM0228", "88160000BM0288", "88160000BM0290", "88160000BM0389", "88160000BM0397", "88160000BM0398", "88160000BM0399", "88160000BM0401", "88160000BM0403", "88160000BM0404", "88160000BM0405", "88160000BM0406", "88160000BM0407", "88160000BM0408", "88160000BM0409", "88160000BM0457", "88160000BM0459", "88160000BM0460", "88160000BM0461", "88160000BM0463", "88160000BM0464", "88160000BM0465", "88160000BM0466", "88160000BM0467", "88160000BM0468"]'::jsonb WHERE "partenaire_slug" = 'ddt-vosges' AND "idtup" = 'ddt88-396' AND "origine" = 'seed';
