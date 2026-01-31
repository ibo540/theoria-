import { Theory, HistoricalEvent } from '../types';
import { theories } from '../data/theories';
import { theoryLimitations } from '../data/theoryLimitations';

export function getAIResponse(
  question: string,
  currentTheory?: Theory,
  currentEvent?: HistoricalEvent
): string {
  const lowerQuestion = question.toLowerCase();

  // Context-aware responses
  if (currentTheory && currentEvent) {
    const limitation = theoryLimitations.find(
      l => l.theoryId === currentTheory.id && l.eventId === currentEvent.id
    );

    if (lowerQuestion.includes('why') && lowerQuestion.includes('struggle')) {
      if (limitation && !limitation.canExplain) {
        return `Great question! ${currentTheory.shortName} struggles with ${currentEvent.name} because:\n\n${limitation.blindSpots.map((spot, idx) => `${idx + 1}. ${spot}`).join('\n')}\n\n💡 Try these theories instead: ${limitation.betterAlternatives?.map(a => a.theoryId).join(', ') || 'Realism or Liberalism'}`;
      }
    }

    if (lowerQuestion.includes('which theory') || lowerQuestion.includes('what theory')) {
      if (limitation && !limitation.canExplain) {
        return `For ${currentEvent.name}, ${currentTheory.shortName} isn't the best fit. Here are better alternatives:\n\n${limitation.betterAlternatives?.map((alt, idx) => `${idx + 1}. ${alt.theoryId}: ${alt.reason}`).join('\n\n')}`;
      }
      return `${currentTheory.shortName} works well for ${currentEvent.name}! It explains:\n\n${currentTheory.keyPrinciples.slice(0, 3).map(p => `• ${p}`).join('\n')}\n\nWant to compare with another theory?`;
    }
  }

  // Theory explanations
  if (lowerQuestion.includes('realism') && lowerQuestion.includes('liberalism')) {
    return `Great question! Here's the key difference:\n\n🔴 **Realism:**\n• States are primary actors\n• International system is anarchic\n• Focus on power and security\n• Zero-sum competition\n• Pessimistic about cooperation\n\n🔵 **Liberalism:**\n• Multiple actors (states, IOs, NGOs)\n• Cooperation is possible\n• Focus on institutions and norms\n• Win-win outcomes possible\n• Optimistic about peace\n\n**Think of it:** Realism is like a security guard always watching for threats. Liberalism is like a community organizer building trust through cooperation!`;
  }

  if (lowerQuestion.includes('realism')) {
    const realism = theories.find(t => t.id === 'classical-realism');
    if (realism) {
      return `**${realism.name}** 🔴\n\n${realism.description}\n\n**Key Principles:**\n${realism.keyPrinciples.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\n**Key Thinkers:** ${realism.keyThinkers.join(', ')}\n\n**Best for explaining:** Security competition, wars, arms races, alliances\n**Struggles with:** Cooperation, peace, institutions`;
  }
  }

  if (lowerQuestion.includes('liberalism')) {
    const liberalism = theories.find(t => t.id === 'liberalism');
    if (liberalism) {
      return `**${liberalism.name}** 🔵\n\n${liberalism.description}\n\n**Key Principles:**\n${liberalism.keyPrinciples.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\n**Key Thinkers:** ${liberalism.keyThinkers.join(', ')}\n\n**Best for explaining:** EU, UN, trade agreements, democratic peace\n**Struggles with:** Wars between democracies, security dilemmas`;
    }
  }

  if (lowerQuestion.includes('constructivism')) {
    const constructivism = theories.find(t => t.id === 'constructivism');
    if (constructivism) {
      return `**${constructivism.name}** 🌟\n\n${constructivism.description}\n\n**Key Principles:**\n${constructivism.keyPrinciples.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\n**Key Thinkers:** ${constructivism.keyThinkers.join(', ')}\n\n**Best for explaining:** Cold War end, identity changes, norm diffusion\n**Struggles with:** Immediate crises where material factors dominate`;
    }
  }

  if (lowerQuestion.includes('english school')) {
    const englishSchool = theories.find(t => t.id === 'english-school');
    if (englishSchool) {
      return `**${englishSchool.name}** 🌿\n\n${englishSchool.description}\n\n**Key Principles:**\n${englishSchool.keyPrinciples.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\n**Key Thinkers:** ${englishSchool.keyThinkers.join(', ')}\n\n**Best for explaining:** Diplomacy, international law, norms, great power management`;
    }
  }

  // Comparison questions
  if (lowerQuestion.includes('difference') || lowerQuestion.includes('compare')) {
    return `I can help you compare theories! Here are some key comparisons:\n\n**Realism vs. Liberalism:**\n• Realism: Conflict is inevitable\n• Liberalism: Peace is possible\n\n**Realism vs. Constructivism:**\n• Realism: Material power matters most\n• Constructivism: Ideas and identity matter most\n\n**Liberalism vs. Constructivism:**\n• Liberalism: Institutions enable cooperation\n• Constructivism: Shared norms enable cooperation\n\nWant me to go deeper on any comparison?`;
  }

  // Event-specific
  if (lowerQuestion.includes('cold war')) {
    return `The **Cold War** is fascinating because different theories explain different aspects:\n\n🔴 **Realism:** Best for 1947-1985\n• Explains bipolar competition\n• Nuclear deterrence\n• Arms race\n\n🌟 **Constructivism:** Best for 1985-1991\n• Explains why it ended peacefully\n• Gorbachev's "New Thinking"\n• Identity transformation\n\n🔵 **Liberalism:** Explains institutional cooperation\n• Arms control treaties\n• UN peacekeeping\n\n**My suggestion:** Start with Realism, then try Constructivism to see why it ended!`;
  }

  if (lowerQuestion.includes('ww') || lowerQuestion.includes('world war')) {
    return `**WWI** is a classic case for **Realism** 🔴\n\nWhy?\n• Alliance systems created automatic escalation\n• Security dilemma drove arms races\n• Balance of power logic failed\n• Multipolar system was unstable\n\n⚠️ **Liberalism struggles here** because:\n• No strong institutions existed in 1914\n• Economic ties didn't prevent war\n• Democratic peace doesn't explain it\n\n**Try Realism or Structural Realism for WWI!**`;
  }

  if (lowerQuestion.includes('eu') || lowerQuestion.includes('european union')) {
    return `The **EU** is a triumph of **Liberalism** 🔵\n\nWhy?\n• Economic interdependence creates peace\n• Democratic peace (no wars between members!)\n• Institutions bind states together\n• Win-win cooperation\n\n⚠️ **Realism can't explain the EU** because:\n• States voluntarily gave up sovereignty\n• Cooperation > competition\n• Institutions actually matter\n\n**Try Liberalism or Neoliberalism for EU!**`;
  }

  // General help
  if (lowerQuestion.includes('help') || lowerQuestion.includes('how')) {
    return `I'm here to help! Here's what I can do:\n\n📚 **Explain theories:**\n• "Explain Realism"\n• "What is Constructivism?"\n• "Difference between theories"\n\n🗺️ **Event analysis:**\n• "Which theory for Cold War?"\n• "Why does Realism fail on EU?"\n\n💡 **Suggestions:**\n• "What should I try next?"\n• "Which theory explains this best?"\n\n🎯 **Comparisons:**\n• "Compare Realism and Liberalism"\n\nJust ask me anything!`;
  }

  if (lowerQuestion.includes('suggest') || lowerQuestion.includes('recommend') || lowerQuestion.includes('next')) {
    if (currentEvent) {
      if (currentEvent.id === 'cold-war') {
        return `For the **Cold War**, I recommend trying:\n\n1. **Realism first** - Explains the competition and arms race\n2. **Then Constructivism** - Shows why it ended peacefully\n3. **Compare!** - See how material vs. ideational factors mattered\n\nThis combination gives you the complete picture!`;
      }
      if (currentEvent.id === 'wwi') {
        return `For **WWI**, definitely try:\n\n1. **Classical Realism** - Explains alliance dynamics and security dilemma\n2. **Structural Realism** - Shows multipolar instability\n\n❌ **Avoid Liberalism** - It struggles with WWI because institutions didn't exist yet!`;
      }
      if (currentEvent.id === 'eu-formation') {
        return `For **EU Formation**, try:\n\n1. **Liberalism** - Perfect fit! Democratic peace and institutions\n2. **Neoliberalism** - Shows how institutions enable cooperation\n\n❌ **Avoid Realism** - Cannot explain why states cooperated so deeply!`;
      }
    }
    return `Great question! Here's my general advice:\n\n**For conflicts/wars:** Try Realism or Neorealism\n**For cooperation/peace:** Try Liberalism or Neoliberalism\n**For identity/norms:** Try Constructivism or English School\n\nSelect an event and I can give more specific suggestions!`;
  }

  // Key thinkers
  if (lowerQuestion.includes('thinker') || lowerQuestion.includes('scholar') || lowerQuestion.includes('who')) {
    return `**Key IR Thinkers:**\n\n🔴 **Realism:**\n• Hans Morgenthau - "Politics Among Nations"\n• Kenneth Waltz - "Theory of International Politics"\n• John Mearsheimer - "The Tragedy of Great Power Politics"\n\n🔵 **Liberalism:**\n• Immanuel Kant - "Perpetual Peace"\n• Robert Keohane - "After Hegemony"\n• Michael Doyle - Democratic Peace Theory\n\n🌟 **Constructivism:**\n• Alexander Wendt - "Social Theory of IR"\n• Martha Finnemore - Norms matter\n\n🌿 **English School:**\n• Hedley Bull - "The Anarchical Society"\n\nWant to know more about any specific thinker?`;
  }

  // Simple terms
  if (lowerQuestion.includes('simple') || lowerQuestion.includes('explain like') || lowerQuestion.includes('eli5')) {
    return `Let me explain IR theories super simply:\n\n🔴 **Realism:** "World is dangerous. Trust no one. Get powerful."\n• Like a tough neighborhood where you need protection\n\n🔵 **Liberalism:** "Working together benefits everyone!"\n• Like neighbors forming a community garden\n\n🌟 **Constructivism:** "What we believe shapes what we do."\n• Like how fashion trends change behavior\n\n🌿 **English School:** "Follow the rules, even if no police."\n• Like international diplomacy and manners\n\n**Bottom line:** Different theories = Different glasses to view the world!`;
  }

  // Default response
  return `That's an interesting question! Here's what I can help with:\n\n💬 Ask me about specific theories:\n"Explain Realism" or "What is Liberalism?"\n\n🗺️ Ask about events:\n"Which theory for Cold War?" or "Why does theory X fail on event Y?"\n\n⚖️ Compare theories:\n"Difference between Realism and Liberalism?"\n\n💡 Get suggestions:\n"Which theory should I try next?"\n\n🎓 Learn key thinkers:\n"Who are the main Realist scholars?"\n\nWhat would you like to know more about?`;
}

