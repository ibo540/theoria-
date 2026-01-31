import { Scenario } from '../types';

export const scenarios: Scenario[] = [
  {
    id: 'scenario-1',
    title: 'China in the South China Sea (2024)',
    description: 'Real-world territorial dispute and rising power dynamics',
    situation: 'China has built artificial islands with military installations in the South China Sea, claimed by multiple nations (Philippines, Vietnam, Malaysia). China asserts historical rights through the "nine-dash line," while the US conducts "freedom of navigation" operations. ASEAN countries are divided on how to respond. As a regional policymaker, what is your approach?',
    options: [
      {
        text: 'Build military alliances (AUKUS, Quad) and increase naval presence to balance Chinese power. Military deterrence is essential to prevent further expansion.',
        theoryAlignment: 'Realism/Neorealism',
        explanation: 'Realist response: Balance rising power through alliances and military buildup. AUKUS (Australia-UK-US) and Quad (US-Japan-India-Australia) are classic balancing coalitions. Security competition in anarchic system requires hard power deterrence.'
      },
      {
        text: 'Strengthen ASEAN institutions and international law (UNCLOS). Encourage Chinese economic integration while using trade leverage and institutional pressure for rule-based behavior.',
        theoryAlignment: 'Liberalism/Neoliberalism',
        explanation: 'Liberal approach: Use institutions (ASEAN, UNCLOS) and economic interdependence. Trade ties make conflict costly. International law provides legitimate framework. Institutional engagement can socialize China into cooperative norms.'
      },
      {
        text: 'Work to reshape Chinese threat perception through dialogue and confidence-building. Emphasize common Asian identity and mutual development rather than zero-sum competition.',
        theoryAlignment: 'Constructivism',
        explanation: 'Constructivist view: Threats are socially constructed. By changing narratives, emphasizing shared regional identity, and building trust, security dilemma can be transformed. Ideas and identity matter more than material power alone.'
      },
      {
        text: 'Accept Chinese regional leadership as inevitable given power shifts. Negotiate accommodation while protecting core interests. Don\'t fight against structural changes in power distribution.',
        theoryAlignment: 'Offensive Realism',
        explanation: 'Offensive realist logic: Recognize power realities. China seeks regional hegemony (rational for great powers). Resisting may be costly. Better to accommodate power shifts while securing vital interests through negotiated spheres of influence.'
      }
    ]
  },
  {
    id: 'scenario-2',
    title: 'Syria Civil War and Humanitarian Crisis (2023-2024)',
    description: 'Ongoing conflict with humanitarian catastrophe',
    situation: 'Syria\'s civil war continues with 500,000+ dead and millions displaced. Assad regime, backed by Russia and Iran, has regained control. Chemical weapons were used against civilians. Turkey occupies northern Syria. UN Security Council remains deadlocked (Russian veto). Refugee crisis affects Europe. How should the international community respond?',
    options: [
      {
        text: 'Recognize that Assad won through Russian/Iranian support. Syria is in their sphere of influence. Accept reality and focus on refugee management and preventing spillover to our allies.',
        theoryAlignment: 'Classical Realism',
        explanation: 'Realist logic: Assad regime survived due to great power backing. Syria is effectively in Russian sphere. Intervening against Russia\'s ally is too costly. Humanitarian concerns don\'t override power realities and national interests.'
      },
      {
        text: 'Pressure through sanctions and ICC prosecution while providing massive humanitarian aid. Use EU leverage to demand accountability. Support civil society and eventual democratic transition.',
        theoryAlignment: 'Liberalism',
        explanation: 'Liberal approach: Use institutions (UN, ICC), sanctions, and aid. Support human rights norms and civil society. Long-term democratic change through international pressure and support for liberal forces, even if gradual.'
      },
      {
        text: 'Accept that sovereignty norms conflict with R2P (Responsibility to Protect). Work through UN for consensus. Provide aid while respecting that Syria is part of international society despite violations.',
        theoryAlignment: 'English School',
        explanation: 'English School balances order and justice. Sovereignty remains foundational even when violated. Prefer working through international society institutions. Humanitarian aid without overthrowing order principle.'
      },
      {
        text: 'Recognize that Western vs. Assad framing is identity-based. Work on reshaping regional narratives. Build new norms around civilian protection through persuasion rather than military intervention.',
        theoryAlignment: 'Constructivism',
        explanation: 'Constructivist view: Conflict driven by identity (Sunni vs. Alawite, West vs. East). Norms of intervention are contested. Focus on norm diffusion and identity transformation rather than material force.'
      }
    ]
  },
  {
    id: 'scenario-3',
    title: 'Ukraine War and NATO Expansion (2022-2024)',
    description: 'Ongoing war in Europe with great power implications',
    situation: 'Russia invaded Ukraine in February 2022, citing NATO expansion as a security threat. Ukraine seeks full NATO membership and EU integration. The war has caused 100,000+ casualties, massive destruction, and global food/energy crises. Finland and Sweden joined NATO in response. Russia threatens nuclear weapons use. How should Western powers proceed?',
    options: [
      {
        text: 'Continue military aid to Ukraine but avoid direct NATO involvement. Russia has legitimate security concerns about NATO expansion. Negotiate Ukrainian neutrality for peace.',
        theoryAlignment: 'Defensive Realism',
        explanation: 'Defensive realist logic: Russia views NATO expansion as security threat (security dilemma). Ukraine buffer state status reduces great power conflict risk. Neutrality deal addresses Russian security concerns while preserving Ukrainian sovereignty.'
      },
      {
        text: 'Full NATO membership for Ukraine and increased military support until Russia withdraws. Aggression must not be rewarded. Uphold international law and sovereignty norms.',
        theoryAlignment: 'Liberalism',
        explanation: 'Liberal principles: Defend sovereignty, international law, and democratic Ukraine. Aggression violates liberal order. Institutions (NATO, EU) must protect members and uphold rules. Deterring future aggression requires firm response.'
      },
      {
        text: 'This is power politics. Russia seeks to restore its sphere of influence. Ukraine is strategically vital. Balance Russian power through arms supplies while avoiding escalation to nuclear war.',
        theoryAlignment: 'Classical Realism',
        explanation: 'Realist analysis: Russia acts as great power reclaiming sphere. Ukraine matters for European balance of power. Provide enough support to prevent Russian victory without triggering nuclear escalation. Pure power calculations.'
      },
      {
        text: 'Russian identity as Eurasian power clashes with Ukrainian identity shift toward Europe. Support Ukrainian self-determination and European identity choice. Ideas matter more than geography.',
        theoryAlignment: 'Constructivism',
        explanation: 'Constructivist view: War driven by identity conflict (Russian imperial identity vs. Ukrainian European identity). Not just about NATO bases but about Ukraine\'s identity choice. Support norm of self-determination and identity freedom.'
      }
    ]
  },
  {
    id: 'scenario-4',
    title: 'Iran Nuclear Program (2024)',
    description: 'Nuclear proliferation and sanctions diplomacy',
    situation: 'Iran has enriched uranium to near-weapons-grade levels (60%), far beyond civilian needs. The 2015 JCPOA nuclear deal collapsed after US withdrawal (2018). Iran cites Israeli nuclear weapons and regional threats. Western sanctions cripple Iranian economy. Israel threatens military strikes. Negotiations have stalled. What approach should be taken?',
    options: [
      {
        text: 'Maximum pressure: Tighter sanctions, support Israeli military option, regime change goal. Iran cannot be trusted. Only force prevents nuclear Iran.',
        theoryAlignment: 'Offensive Realism',
        explanation: 'Offensive realist view: Iran seeks regional hegemony. Nuclear weapons would shift Middle East balance irreversibly. Preventive action (sanctions, military strikes) necessary to maintain power distribution. Cannot trust adversaries in anarchy.'
      },
      {
        text: 'Revive JCPOA negotiations with stronger verification. Offer sanctions relief for verifiable nuclear limits. Institutions and agreements can constrain Iran even without trust.',
        theoryAlignment: 'Neoliberalism',
        explanation: 'Neoliberal approach: Regimes work even under anarchy. JCPOA demonstrated institutional mechanisms can verify and constrain. Economic incentives (sanctions relief) change cost-benefit. Monitoring reduces cheating. Cooperation possible through institutions.'
      },
      {
        text: 'Accept Iran has legitimate security concerns (Israel\'s nukes, US threats). Negotiate comprehensive regional security framework addressing all parties\' fears, including Iran\'s.',
        theoryAlignment: 'Defensive Realism',
        explanation: 'Defensive realist logic: Iran faces real security threats. Nuclear pursuit is defensive response to security dilemma. Address root causes (regional threat environment). Security guarantees and regional balance better than coercion.'
      },
      {
        text: 'Iranian identity as Islamic Republic and regional power drives nuclear ambition. Western pressure reinforces nationalist identity. Reshape narratives and build new regional identity frameworks that make nukes unnecessary.',
        theoryAlignment: 'Constructivism',
        explanation: 'Constructivist analysis: Nuclear program tied to Iranian identity (technological achievement, resistance to West). External pressure strengthens regime identity. Transform identity dynamics and regional norms rather than use force.'
      }
    ]
    
  }
];

