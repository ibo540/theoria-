export interface CountryInfo {
  name: string;
  position: [number, number];
  region: string;
  events: {
    [eventId: string]: {
      role: string;
      perspectives: {
        realism?: string;
        liberalism?: string;
        neoliberalism?: string;
        constructivism?: string;
        'structural-realism'?: string;
        'english-school'?: string;
      };
    };
  };
}

export const countryDatabase: CountryInfo[] = [
  {
    name: 'Syria',
    position: [34.8021, 38.9968],
    region: 'Middle East',
    events: {
      'cold-war': {
        role: 'Soviet-aligned regional power',
        perspectives: {
          realism: 'Syria aligned with the Soviet Union to balance against U.S. influence and Israel. Received Soviet military aid, MiG fighters, and tanks. Participated in regional power struggles. Alliance driven by security concerns and need for external patron against stronger neighbors.',
          liberalism: 'Limited participation in liberal international institutions. Authoritarian Ba\'ath regime prevented democratic cooperation. Regional isolation drove Soviet dependence. Excluded from Western economic networks.',
          constructivism: 'Identity shaped by Arab socialism and anti-imperialist ideology. Saw itself as part of anti-colonial struggle. Ba\'athist identity of Arab unity drove foreign policy. Soviet alliance reflected ideological affinity, not just security needs.',
          'structural-realism': 'Small state in multipolar Middle East subsystem. Bandwagoned with distant superpower (USSR) against proximate threats (Israel, Western powers). Classic balancing behavior in regional context.',
        }
      }
    }
  },
  {
    name: 'Turkey',
    position: [39.9334, 32.8597],
    region: 'Middle East / Europe',
    events: {
      'cold-war': {
        role: 'NATO member and strategic bridge',
        perspectives: {
          realism: 'Strategically crucial NATO member. Controlled access to Black Sea (Bosphorus). Balanced between NATO and regional interests. Geography determined strategic value. Used alliance position for security and aid.',
          liberalism: 'NATO membership locked Turkey into Western institutional framework. Democratic periods enabled cooperation. Economic integration with Europe through trade agreements. Institutional ties constrained but also empowered.',
          constructivism: 'Identity torn between European and Middle Eastern orientations. Kemalist secularism vs. Islamic identity. NATO membership represented Western identity choice. Identity debates shaped foreign policy oscillations.',
          'english-school': 'Member of international society playing bridge role. Respected sovereignty norms while participating in Western alliance system. Diplomatic culture balanced Eastern and Western traditions.',
        }
      }
    }
  },
  {
    name: 'Egypt',
    position: [26.8206, 30.8025],
    region: 'Middle East / North Africa',
    events: {
      'cold-war': {
        role: 'Non-Aligned leader and regional power',
        perspectives: {
          realism: 'Regional power under Nasser seeking autonomy. Played superpowers against each other for maximum aid. Switched from Western to Soviet patronage (1956). Classic balancing and bandwagoning.',
          liberalism: 'Leader of Non-Aligned Movement. Used international institutions (UN, Arab League) for voice. Limited democracy constrained liberal cooperation. Suez Crisis showed institutional limits.',
          constructivism: 'Nasserist pan-Arab identity drove foreign policy. Anti-colonial and anti-imperialist identity. Arab socialism ideology. Charismatic leadership changed regional identity politics.',
          neoliberalism: 'Used institutions (UN) strategically. Suez Crisis showed how small states can leverage institutions against great powers. Peace treaty with Israel (1978) locked in through Camp David regime.',
        }
      }
    }
  },
  {
    name: 'Israel',
    position: [31.0461, 34.8516],
    region: 'Middle East',
    events: {
      'cold-war': {
        role: 'U.S.-aligned regional power',
        perspectives: {
          realism: 'Small state in hostile environment. Allied with U.S. for security and military aid. Superior military power enabled by external support. Security-driven behavior in anarchic regional system.',
          liberalism: 'Democratic state in non-democratic region. Institutional ties with West (trade, aid agreements). Democratic peace doesn\'t apply when neighbors are non-democracies. Liberal values in domestic politics, realist behavior externally.',
          constructivism: 'Jewish state identity central to existence and foreign policy. Surrounded by states denying its legitimacy. Identity conflict more than material power struggle. Perceived threats socially constructed through Arab-Israeli identity divide.',
          'structural-realism': 'Classic case of external balancing. Aligned with distant superpower (US) against proximate threats (Arab states). Geography and power asymmetry drove alliance choices.',
        }
      }
    }
  },
  {
    name: 'Yugoslavia',
    position: [44.0165, 21.0059],
    region: 'Balkans',
    events: {
      'cold-war': {
        role: 'Non-aligned Communist state',
        perspectives: {
          realism: 'Tito\'s Yugoslavia balanced between superpowers. Maintained independence from Soviet bloc despite communist ideology. Geography between East and West enabled neutrality. Received aid from both sides.',
          liberalism: 'Founder of Non-Aligned Movement. Created third way between blocs. Limited institutional cooperation with either side. Self-management socialism attempted third path.',
          constructivism: 'Titoist identity distinct from Soviet communism. National communism vs. international communism. Yugoslav identity transcended ethnic divisions (until 1990s). Charismatic leadership constructed unique identity.',
          'structural-realism': 'Refused to bandwagon with either pole. Buffer state between NATO and Warsaw Pact. System structure allowed neutrality due to geographic position and internal strength.',
        }
      }
    }
  },
  {
    name: 'Poland',
    position: [51.9194, 19.1451],
    region: 'Eastern Europe',
    events: {
      'cold-war': {
        role: 'Warsaw Pact member under Soviet control',
        perspectives: {
          realism: 'Geographically trapped between Germany and USSR. No choice but Soviet alliance after WWII. Buffer state protecting Soviet western border. Geography determined fate.',
          liberalism: 'Communist regime prevented liberal cooperation with West. Limited sovereignty. Solidarity movement (1980s) showed domestic push for democracy and Western alignment.',
          constructivism: 'Catholic and Western cultural identity clashed with imposed communism. Pope John Paul II strengthened Polish identity resistance. Identity more Western European than Soviet. 1989 revolution reflected identity reassertion.',
          'english-school': 'Sovereignty compromised by Soviet dominance. Part of international society but constrained by great power sphere. 1989 showed norms of self-determination prevailing.',
        }
      }
    }
  },
  {
    name: 'Sweden',
    position: [60.1282, 18.6435],
    region: 'Northern Europe',
    events: {
      'cold-war': {
        role: 'Neutral state between blocs',
        perspectives: {
          realism: 'Neutrality as security strategy. Avoided entanglement in superpower rivalry. Strong military for self-defense. Geographic distance from central European conflict enabled neutrality.',
          liberalism: 'Democratic welfare state. Participated in international institutions (UN peacekeeping). Used neutrality to promote mediation and cooperation. Economic interdependence with West while politically neutral.',
          'structural-realism': 'Classic buffer state. Neutrality stabilized bipolar system by reducing direct NATO-Warsaw Pact contact. System structure allowed and rewarded neutrality.',
          'english-school': 'Upheld international norms while neutral. Major contributor to UN peacekeeping. Diplomatic bridge between blocs. Neutral but active in international society.',
        }
      }
    }
  },
  {
    name: 'Japan',
    position: [36.2048, 138.2529],
    region: 'East Asia',
    events: {
      'cold-war': {
        role: 'U.S. ally and economic powerhouse',
        perspectives: {
          realism: 'Bandwagoned with U.S. after WWII defeat. Security alliance (1951 treaty) in exchange for U.S. protection. Geographic vulnerability to USSR and China required external balancing.',
          liberalism: 'Democratic transformation under U.S. occupation. Economic interdependence with West. Peace Constitution Article 9. Shows democratic peace and economic ties creating cooperation.',
          constructivism: 'Identity transformation from militarist empire to peaceful economic power. U.S. socialization during occupation internalized pacifist norms. New identity as trading state, not military power.',
          neoliberalism: 'Embedded in U.S.-led institutional order. Used economic institutions (GATT, later WTO) to rebuild. Alliance with U.S. provided security umbrella enabling economic focus.',
        }
      }
    }
  },
  {
    name: 'Saudi Arabia',
    position: [23.8859, 45.0792],
    region: 'Middle East',
    events: {
      'cold-war': {
        role: 'U.S.-aligned oil power',
        perspectives: {
          realism: 'Oil resources made it strategically vital. Allied with U.S. for security against regional threats (Iran, Iraq, USSR). Traded oil access for protection. Material resources drove great power attention.',
          liberalism: 'Authoritarian monarchy. Limited institutional cooperation. Oil wealth enabled economic interdependence with West. OPEC membership showed selective institutional participation.',
          constructivism: 'Islamic identity shaped foreign policy. Sunni leadership role. Spread of Wahhabism ideology. Petro-Islam funding religious institutions globally. Identity as guardian of holy sites.',
          neoliberalism: 'Used oil as lever in international politics. OPEC as cartel regime. Petrodollar recycling through Western banks. Strategic use of economic institutions.',
        }
      }
    }
  },
  {
    name: 'Brazil',
    position: [-14.2350, -51.9253],
    region: 'South America',
    events: {
      'cold-war': {
        role: 'Regional power with varying alignments',
        perspectives: {
          realism: 'Regional hegemon in South America. Military dictatorship (1964-1985) aligned with U.S. against communism. Pursued regional dominance. Power-seeking within hemisphere.',
          liberalism: 'Transitions between democracy and authoritarianism. Democratic periods showed more cooperation. Economic interdependence with U.S. and Europe. Limited institutional participation.',
          constructivism: 'National identity oscillated between military nationalism and democratic participation. Developmentalist ideology. Regional leadership identity shaped policies. Military regime identity vs. democratic identity.',
          'structural-realism': 'Dominated regional subsystem. U.S. hegemony in Western Hemisphere limited but didn\'t eliminate Brazilian regional power. Accepted U.S. primacy while pursuing regional goals.',
        }
      }
    }
  },
  {
    name: 'Iran',
    position: [32.4279, 53.6880],
    region: 'Middle East',
    events: {
      'cold-war': {
        role: 'U.S.-aligned until 1979 revolution',
        perspectives: {
          realism: 'Strategic location (oil, Soviet border) made it valuable to U.S. Shah regime received massive military aid. 1979 revolution shifted from U.S. to anti-U.S. alignment. Classic case of alignment shifts based on regime change.',
          liberalism: 'Autocratic monarchy prevented genuine cooperation. 1979 revolution showed limits of alliances without democratic legitimacy. Post-revolution isolation from liberal international order.',
          constructivism: 'Revolutionary transformation of identity. From pro-Western monarchy to anti-Western Islamic Republic. Identity change drove complete foreign policy reversal. Shows how ideas trump material interests.',
        }
      }
    }
  },
  {
    name: 'Vietnam',
    position: [14.0583, 108.2772],
    region: 'Southeast Asia',
    events: {
      'cold-war': {
        role: 'Divided state, then unified under communism',
        perspectives: {
          realism: 'Proxy battlefield for superpower competition. North Vietnam received Soviet/Chinese aid. South Vietnam received U.S. support. Classic proxy war for influence.',
          liberalism: 'Failure of liberal nation-building in South. Authoritarian regimes on both sides prevented democratic cooperation. Shows limits of external democratization.',
          constructivism: 'National liberation identity drove North Vietnamese resilience. Anti-colonial identity more powerful than material power disadvantage. Ho Chi Minh\'s ideology mobilized population.',
        }
      }
    }
  },
  {
    name: 'South Korea',
    position: [35.9078, 127.7669],
    region: 'East Asia',
    events: {
      'cold-war': {
        role: 'U.S.-aligned frontline state',
        perspectives: {
          realism: 'Faced existential threat from North Korea. Total dependence on U.S. security guarantee. Alliance necessity, not choice. Geographic vulnerability drove alignment.',
          liberalism: 'Democratized over time (1980s). Economic miracle through trade and U.S. support. Eventual democracy enabled deeper cooperation. Shows development-democracy link.',
          constructivism: 'Anti-communist identity forged by Korean War. Strong national identity despite division. U.S. alliance became part of national identity. Cold War shaped Korean sense of self.',
        }
      }
    }
  },
  {
    name: 'India',
    position: [20.5937, 78.9629],
    region: 'South Asia',
    events: {
      'cold-war': {
        role: 'Non-Aligned Movement leader',
        perspectives: {
          realism: 'Large power pursuing strategic autonomy. Non-alignment maximized aid from both sides. Played superpowers against each other. Realist behavior disguised as moralistic non-alignment.',
          liberalism: 'Democratic but pragmatic. Founder of Non-Aligned Movement. Used institutions for voice. Shows democracy doesn\'t automatically mean Western alignment.',
          constructivism: 'Post-colonial identity of independence and non-alignment. Moral leadership aspiration. Nehru\'s vision of Third World solidarity. Identity as bridge between blocs, not as subordinate.',
          'english-school': 'Great power in regional context. Leader in creating non-aligned as distinct international society. Promoted new norms of decolonization and development.',
        }
      }
    }
  },
  {
    name: 'West Germany',
    position: [50.1109, 8.6821],
    region: 'Western Europe',
    events: {
      'cold-war': {
        role: 'Divided frontline state, Western anchor',
        perspectives: {
          realism: 'Divided nation on Cold War frontline. Hosted NATO troops as buffer. Feared Soviet invasion. Total dependence on U.S. security. Geography determined vulnerability.',
          liberalism: 'Democratic transformation post-WWII. Deeply integrated in Western institutions (NATO, EEC). Economic miracle through trade. Democratic peace with former enemies (France). Model of liberal success.',
          constructivism: 'Identity transformation from Nazi aggression to peaceful democracy. Vergangenheitsbewältigung (coming to terms with past). European identity adoption. Constitutional pacifism norm.',
          neoliberalism: 'Used institutions to overcome WWII legacy. European integration locked in peaceful identity. Regained legitimacy through institutional embeddedness.',
        }
      },
      'eu-formation': {
        role: 'Economic powerhouse and integration leader',
        perspectives: {
          liberalism: 'Post-WWII democratic transformation enabled deep EU integration. Economic interdependence with France prevented war. Democratic peace in action. Trade partnerships replaced military rivalry.',
          neoliberalism: 'Used EU institutions to overcome Nazi legacy and regain legitimacy. Embedded liberalism. Economic power through single market. Institutional constraints accepted for benefits.',
          constructivism: 'Identity shift from aggressive nationalism to peaceful multilateralism. European identity internalized. Norms of cooperation and integration became part of German identity.',
        }
      }
    }
  },
  {
    name: 'France',
    position: [48.8566, 2.3522],
    region: 'Western Europe',
    events: {
      'cold-war': {
        role: 'NATO member with independent nuclear force',
        perspectives: {
          realism: 'Medium power seeking autonomy. Built independent nuclear force (force de frappe). Stayed in NATO but maintained distance from U.S. Balanced within alliance.',
          liberalism: 'Democratic state driving European integration. Leader in building EEC institutions. Democratic peace with Germany.',
          constructivism: 'Gaullist identity of independence. National pride shaped foreign policy. French exceptionalism persisted through Cold War.',
        }
      },
      'wwi': {
        role: 'Triple Entente member, invaded',
        perspectives: {
          realism: 'Sought security through alliances against Germany. Feared German power after 1871 defeat. Alliance with Russia for balance.',
          liberalism: 'Democratic republic but security fears overrode liberal values. Economic interdependence with Germany insufficient to prevent war.',
          constructivism: 'Identity shaped by 1871 defeat and desire for revanche. National honor drove alliance choices and war support.',
        }
      },
      'eu-formation': {
        role: 'Founding member and integration leader',
        perspectives: {
          liberalism: 'Democratic peace vision with Germany. Economic interdependence prevents war. Genuine institutional commitment.',
          neoliberalism: 'Strategic institution-builder. Uses EU regimes to amplify power beyond material capabilities. Common Agricultural Policy benefits France.',
          constructivism: 'Post-WWII identity shift from nationalism to European cooperation. Schuman Declaration showed ideational change.',
        }
      },
      'un-formation': {
        role: 'Great power and Security Council member',
        perspectives: {
          liberalism: 'Democratic victor in WWII. Supported liberal international order through UN. Championed human rights and international law.',
          neoliberalism: 'Permanent Security Council member using institutional position for influence. UN multilateralism serves French interests.',
          'english-school': 'Great power with responsibility for international order. Upholds diplomatic traditions and international law.',
        }
      }
    }
  },
  {
    name: 'Germany',
    position: [52.5200, 13.4050],
    region: 'Western Europe',
    events: {
      'wwi': {
        role: 'Central Powers leader, rising power',
        perspectives: {
          realism: 'Rising power creating fear through growth. Surrounded by hostile alliances (encirclement). Arms buildup for defense appeared aggressive. Classic security dilemma.',
          liberalism: 'Limited democracy. Militaristic culture. Economic ties with Britain/France failed to prevent security domination.',
          constructivism: 'National identity of greatness and honor. Perceived encirclement created threat regardless of actual intentions. Weltpolitik ideology.',
        }
      },
      'eu-formation': {
        role: 'Economic powerhouse, reformed democracy',
        perspectives: {
          liberalism: 'Democratic transformation enabled EU integration. Economic interdependence with France. Model of peaceful change.',
          neoliberalism: 'Economic strength through EU single market. Institutional embeddedness overcame past. Dominant economy in Europe.',
          constructivism: 'Complete identity transformation. From Nazi aggression to peaceful multilateralism. European identity genuinely internalized.',
        }
      }
    }
  },
  {
    name: 'United Kingdom',
    position: [51.5074, -0.1278],
    region: 'Western Europe',
    events: {
      'cold-war': {
        role: 'U.S. ally with special relationship',
        perspectives: {
          realism: 'Declining power maintaining influence through U.S. alliance. Nuclear weapons and UN Security Council seat preserve status.',
          liberalism: 'Democratic leader promoting liberal values. Founding NATO and European cooperation member.',
          'english-school': 'Diplomatic great power upholding international law and norms. Bridges U.S. and Europe.',
        }
      },
      'wwi': {
        role: 'Triple Entente member, naval power',
        perspectives: {
          realism: 'Balanced against German power. Naval supremacy threatened by German buildup. Entered war to prevent German hegemony.',
          liberalism: 'Liberal democracy. Belgian neutrality violation triggered intervention (norm-based). Alliance commitments binding.',
          constructivism: 'Identity as empire and naval power. German naval challenge seen as existential threat to British identity.',
        }
      },
      'eu-formation': {
        role: 'Reluctant member, eventual Brexit',
        perspectives: {
          liberalism: 'Democratic state benefiting from trade but skeptical of political integration. Economic interdependence vs. sovereignty concerns.',
          neoliberalism: 'Used EU economically while resisting political integration. Cherry-picked institutional participation.',
          constructivism: 'Island identity separate from continent. British exceptionalism resisted European identity. Brexit showed identity limits of integration.',
        }
      },
      'un-formation': {
        role: 'Great power, Security Council founder',
        perspectives: {
          liberalism: 'Democratic victor promoting liberal international order. Churchill\'s vision of international cooperation.',
          'english-school': 'Great power with special responsibility. Diplomatic tradition. Upholder of international society norms.',
        }
      }
    }
  },
  {
    name: 'Russia',
    position: [55.7558, 37.6173],
    region: 'Eastern Europe / Asia',
    events: {
      'wwi': {
        role: 'Triple Entente member, Eastern Front',
        perspectives: {
          realism: 'Empire seeking Balkan influence. Alliance with Serbia and France to balance Germany/Austria. Mobilization triggered war.',
          liberalism: 'Autocracy limiting cooperation. No democratic constraints on war. Mobilization caused automatic escalation.',
          constructivism: 'Pan-Slavic identity. Protector of Slavic peoples. Serbian cause became Russian honor issue.',
        }
      }
    }
  },
  {
    name: 'United States',
    position: [38.9072, -77.0369],
    region: 'North America',
    events: {
      'cold-war': {
        role: 'Superpower, Western bloc leader',
        perspectives: {
          realism: 'Superpower pursuing global hegemony. Power maximizer using NATO and nuclear deterrence.',
          liberalism: 'Leader of liberal international order. Promotes democracy, free trade, institutions.',
          neoliberalism: 'Hegemon providing public goods. Uses regimes to manage cooperation.',
          constructivism: 'Identity as "leader of free world". Spreads democratic norms.',
          'structural-realism': 'Pole in bipolar system. Structure determines must balance Soviet power.',
        }
      },
      'cuban-missile-crisis': {
        role: 'Superpower defending hemisphere',
        perspectives: {
          realism: 'Defending Monroe Doctrine sphere. Soviet missiles unacceptable power shift. Naval blockade forced removal.',
          'structural-realism': 'Maintaining nuclear balance. Deterrence logic prevented escalation despite crisis.',
          'english-school': 'Respected norms (no Cuba invasion) while defending interests. Crisis management through diplomacy.',
        }
      },
      'un-formation': {
        role: 'Hegemon and institutional founder',
        perspectives: {
          liberalism: 'Democratic leader building Wilsonian liberal order. UN embodies ideals of collective security.',
          neoliberalism: 'Hegemon creating institutions for order management. Provides public goods (security, monetary system).',
          'english-school': 'Great power accepting responsibility for order. Security Council reflects great power concert.',
        }
      }
    }
  },
  {
    name: 'Soviet Union',
    position: [55.7558, 37.6173],
    region: 'Eastern Europe / Asia',
    events: {
      'cold-war': {
        role: 'Superpower, Eastern bloc leader',
        perspectives: {
          realism: 'Rival superpower competing for influence. Seeks security through buffer states and power.',
          liberalism: 'Authoritarian limiting cooperation. Lack of democracy prevents engagement.',
          constructivism: 'Revolutionary identity drives behavior. 1985+ identity shift (Gorbachev) ends Cold War.',
          'structural-realism': 'Second pole. Must compete due to structure, not ideology.',
        }
      },
      'cuban-missile-crisis': {
        role: 'Superpower challenging U.S.',
        perspectives: {
          realism: 'Attempting cheap strategic balance change. Testing U.S. resolve.',
          'structural-realism': 'Inferior position. Cuba missiles offset U.S. Turkey missiles. Balance of power.',
          'english-school': 'Pushed norms to limit but respected crisis management. Backed down to avoid war.',
        }
      },
      'un-formation': {
        role: 'Great power, Security Council member',
        perspectives: {
          neoliberalism: 'Uses institutions strategically. Veto protects interests.',
          'english-school': 'Recognizes international society need. Shares basic norms despite ideology.',
        }
      }
    }
  },
  {
    name: 'Afghanistan',
    position: [33.9391, 67.7100],
    region: 'Central Asia',
    events: {
      'cold-war': {
        role: 'Soviet invasion target, U.S. proxy support',
        perspectives: {
          realism: 'Buffer state invaded by USSR (1979). U.S. provided aid to Mujahideen to bleed Soviets. Classic great power competition via proxy. Strategic location made it valuable.',
          liberalism: 'Authoritarian regime. Limited institutional participation. War destroyed institutions. Shows international community failure to prevent invasion.',
          constructivism: 'Mujahideen framed struggle as Islamic jihad against atheist communism. Identity-based resistance. U.S. supported through identity framing despite ideological differences.',
        }
      }
    }
  },
  {
    name: 'Cuba',
    position: [21.5218, -77.7812],
    region: 'Caribbean',
    events: {
      'cold-war': {
        role: 'Soviet ally in Western hemisphere',
        perspectives: {
          realism: 'Small state seeking Soviet protection against U.S. threat (90 miles away). Rational balancing despite geographic distance. Missile crisis showed risks of superpower proxy.',
          liberalism: 'Castro\'s authoritarianism prevented cooperation with Western hemisphere institutions. Excluded from OAS. Isolation drove Soviet dependence.',
          constructivism: 'Revolutionary identity as anti-imperialist. Castro\'s charisma built new Cuban identity. Solidarity with Third World movements. Identity more important than material costs of U.S. embargo.',
        }
      },
      'cuban-missile-crisis': {
        role: 'Trigger of nuclear confrontation',
        perspectives: {
          realism: 'Small state caught between superpowers. Used by USSR for strategic gain. Endangered by being proxy. Shows costs of superpower alliance for small states.',
          'structural-realism': 'Geographic proximity to U.S. made it strategic asset for USSR. Attempt to change nuclear balance. Structure of bipolar system drove crisis.',
          'english-school': 'Sovereignty respected even by U.S. (no invasion). Great powers negotiated over Cuba without Cuban input. Shows great power management excluding small powers.',
        }
      }
    }
  },
  {
    name: 'China',
    position: [35.8617, 104.1954],
    region: 'East Asia',
    events: {
      'cold-war': {
        role: 'Communist power, Sino-Soviet split',
        perspectives: {
          realism: 'Sino-Soviet split (1960s) shows security trumps ideology. China feared Soviet power more than shared communism. Aligned with U.S. (1970s) against USSR despite ideological difference. Pure balance of power.',
          liberalism: 'Authoritarian regime limiting cooperation. Economic opening (1980s) brought integration into global economy. Shows economic incentives can overcome ideology.',
          constructivism: 'Distinct Chinese communist identity vs. Soviet model. Maoism as unique ideology. Cultural Revolution showed ideational factors. Identity as Middle Kingdom persisted through communism.',
          'structural-realism': 'Balanced against proximate threat (USSR) by aligning with distant power (U.S.). Classic external balancing. Shows system structure determines behavior more than ideology.',
        }
      }
    }
  },
  {
    name: 'South Africa',
    position: [-30.5595, 22.9375],
    region: 'Southern Africa',
    events: {
      'cold-war': {
        role: 'Apartheid state, Western-aligned',
        perspectives: {
          realism: 'Used anti-communism to maintain Western support despite apartheid. Strategic mineral resources and Cape route made it valuable. Intervened in Angola against Soviet-backed forces.',
          liberalism: 'Apartheid violated liberal norms. Increasing isolation from liberal international order. Sanctions showed institutions can pressure states. Post-apartheid shows democracy enabling reintegration.',
          constructivism: 'White Afrikaner identity of racial superiority. Anti-apartheid movement spread global norms of racial equality. Norm diffusion eventually ended apartheid. Identity transformation required for reintegration.',
          'english-school': 'Violated fundamental norms of racial equality. International society increasingly rejected South Africa. Shows tension between sovereignty and justice. Norms eventually trumped sovereignty protection.',
        }
      }
    }
  },
  {
    name: 'North Korea',
    position: [40.3399, 127.5101],
    region: 'East Asia',
    events: {
      'cold-war': {
        role: 'Soviet/Chinese-backed communist state',
        perspectives: {
          realism: 'Buffer state for China and USSR. Played patrons against each other. Invasion of South (1950) classic aggression. Survived through great power support.',
          liberalism: 'Totalitarian isolation. Zero participation in liberal institutions. Autarky prevented economic interdependence. Extreme case of institutional non-engagement.',
          constructivism: 'Juche ideology of self-reliance. Cult of personality (Kim Il-sung). Identity as revolutionary vanguard. Most isolated identity in international system.',
          'structural-realism': 'Beneficiary of Sino-Soviet competition. Both patrons supported to prevent other\'s dominance. Buffer between China and U.S. forces. System structure explains survival.',
        }
      }
    }
  },
];

// Helper function to get country info
export function getCountryInfo(countryName: string, eventId: string): CountryInfo | null {
  const country = countryDatabase.find(c => c.name.toLowerCase() === countryName.toLowerCase());
  if (!country) return null;
  if (!country.events[eventId]) return null;
  return country;
}

// Get all countries for an event
export function getCountriesForEvent(eventId: string): string[] {
  return countryDatabase
    .filter(c => c.events[eventId])
    .map(c => c.name)
    .sort();
}


