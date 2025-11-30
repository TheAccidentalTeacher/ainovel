"""
Service for generating live HTML preview of premise builder decisions.

Creates a growing document that shows all decisions made during the premise building process.
"""

from typing import Optional
from models.premise_builder import PremiseBuilderSession


def generate_preview_html(session: PremiseBuilderSession) -> str:
    """
    Generate an HTML document showing all premise decisions made so far.
    
    Args:
        session: The premise builder session
        
    Returns:
        HTML string with styled document
    """
    html_parts = [
        """
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Story Plan Preview</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: 'Georgia', serif;
                    line-height: 1.8;
                    color: #2c3e50;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 2rem;
                }
                
                .container {
                    max-width: 900px;
                    margin: 0 auto;
                    background: white;
                    padding: 3rem;
                    border-radius: 12px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                }
                
                h1 {
                    font-size: 2.5rem;
                    color: #667eea;
                    margin-bottom: 0.5rem;
                    text-align: center;
                    font-weight: 700;
                }
                
                .subtitle {
                    text-align: center;
                    color: #7f8c8d;
                    font-style: italic;
                    margin-bottom: 3rem;
                    font-size: 1.1rem;
                }
                
                .section {
                    margin-bottom: 2.5rem;
                    padding-bottom: 2rem;
                    border-bottom: 2px solid #ecf0f1;
                }
                
                .section:last-child {
                    border-bottom: none;
                }
                
                h2 {
                    font-size: 1.8rem;
                    color: #764ba2;
                    margin-bottom: 1rem;
                    font-weight: 600;
                }
                
                h3 {
                    font-size: 1.3rem;
                    color: #8e44ad;
                    margin-top: 1.5rem;
                    margin-bottom: 0.75rem;
                    font-weight: 600;
                }
                
                .label {
                    font-weight: 600;
                    color: #34495e;
                    display: inline-block;
                    margin-bottom: 0.25rem;
                }
                
                .value {
                    color: #2c3e50;
                    margin-bottom: 1rem;
                }
                
                .badge {
                    display: inline-block;
                    background: #667eea;
                    color: white;
                    padding: 0.25rem 0.75rem;
                    border-radius: 20px;
                    font-size: 0.9rem;
                    margin-right: 0.5rem;
                    margin-bottom: 0.5rem;
                }
                
                .list-item {
                    margin-left: 1.5rem;
                    margin-bottom: 0.5rem;
                    color: #2c3e50;
                }
                
                .list-item::before {
                    content: "→ ";
                    color: #667eea;
                    font-weight: bold;
                    margin-right: 0.5rem;
                }
                
                .slider-value {
                    display: inline-block;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 0.5rem 1rem;
                    border-radius: 8px;
                    font-weight: 600;
                    margin-top: 0.5rem;
                }
                
                .incomplete {
                    color: #95a5a6;
                    font-style: italic;
                }
                
                .logline-box {
                    background: #f8f9fa;
                    border-left: 4px solid #667eea;
                    padding: 1.5rem;
                    margin: 1rem 0;
                    border-radius: 4px;
                    font-size: 1.1rem;
                    line-height: 1.8;
                }
                
                .timestamp {
                    text-align: center;
                    color: #95a5a6;
                    font-size: 0.9rem;
                    margin-top: 3rem;
                    padding-top: 2rem;
                    border-top: 1px solid #ecf0f1;
                }
            </style>
        </head>
        <body>
            <div class="container">
        """
    ]
    
    # Title
    html_parts.append(f"""
                <h1>📖 Story Plan Preview</h1>
                <div class="subtitle">Building Your Novel's Foundation</div>
    """)
    
    # Step 0: Project Info
    if session.project_stub:
        ps = session.project_stub
        html_parts.append("""
                <div class="section">
                    <h2>📋 Project Information</h2>
        """)
        
        if ps.title:
            html_parts.append(f"""
                    <div class="label">Project Title:</div>
                    <div class="value">{ps.title}</div>
            """)
        
        if ps.folder:
            html_parts.append(f"""
                    <div class="label">Folder:</div>
                    <div class="value">{ps.folder}</div>
            """)
        
        if ps.logline:
            html_parts.append(f"""
                    <h3>Logline</h3>
                    <div class="logline-box">{ps.logline}</div>
            """)
        
        html_parts.append("</div>")
    
    # Step 1: Genre Profile
    if session.genre_profile:
        gp = session.genre_profile
        html_parts.append("""
                <div class="section">
                    <h2>🎭 Genre & Style</h2>
        """)
        
        if gp.primary_genre:
            html_parts.append(f"""
                    <div class="label">Primary Genre:</div>
                    <div class="value"><span class="badge">{gp.primary_genre}</span></div>
            """)
        
        if gp.secondary_genre:
            html_parts.append(f"""
                    <div class="label">Secondary Genre:</div>
                    <div class="value"><span class="badge">{gp.secondary_genre}</span></div>
            """)
        
        if gp.subgenres:
            html_parts.append("""
                    <div class="label">Subgenres:</div>
                    <div class="value">
            """)
            for sg in gp.subgenres:
                html_parts.append(f'<span class="badge">{sg}</span>')
            html_parts.append("</div>")
        
        if gp.audience_rating:
            html_parts.append(f"""
                    <div class="label">Audience Rating:</div>
                    <div class="value"><span class="badge">{gp.audience_rating}</span></div>
            """)
        
        html_parts.append("</div>")
    
    # Step 2: Tone & Theme
    if session.tone_theme_profile:
        tt = session.tone_theme_profile
        html_parts.append("""
                <div class="section">
                    <h2>🎨 Tone & Themes</h2>
        """)
        
        if tt.darkness_level or tt.humor_level:
            html_parts.append('<h3>Tone Sliders</h3>')
            if tt.darkness_level:
                html_parts.append(f"""
                    <div class="label">Darkness Level:</div>
                    <div class="slider-value">Level {tt.darkness_level} / 10</div>
                """)
            if tt.humor_level:
                html_parts.append(f"""
                    <div class="label">Humor Level:</div>
                    <div class="slider-value">Level {tt.humor_level} / 10</div>
                """)
        
        if tt.themes:
            html_parts.append("""
                    <h3>Thematic Elements</h3>
            """)
            for theme in tt.themes:
                html_parts.append(f'<div class="list-item">{theme}</div>')
        
        if tt.emotional_tone:
            html_parts.append(f"""
                    <h3>Emotional Journey</h3>
                    <div class="value">{tt.emotional_tone}</div>
            """)
        
        if tt.core_values:
            html_parts.append("""
                    <h3>Core Values</h3>
            """)
            for value in tt.core_values:
                html_parts.append(f'<div class="list-item">{value}</div>')
        
        if tt.central_question:
            html_parts.append(f"""
                    <h3>Central Question</h3>
                    <div class="value">{tt.central_question}</div>
            """)
        
        if tt.atmospheric_elements:
            html_parts.append("""
                    <h3>Atmospheric Elements</h3>
            """)
            for atm in tt.atmospheric_elements:
                html_parts.append(f'<span class="badge">{atm}</span>')
        
        if tt.heat_level:
            html_parts.append(f"""
                    <h3>Romance Heat Level</h3>
                    <div class="value"><span class="badge">{tt.heat_level.value.title()}</span></div>
            """)
        
        html_parts.append("</div>")
    
    # Step 3: Characters
    if session.character_seeds:
        chars = session.character_seeds
        html_parts.append("""
                <div class="section">
                    <h2>👥 Characters</h2>
        """)
        
        if chars.protagonist:
            html_parts.append(f"""
                    <h3>Protagonist: {chars.protagonist.name}</h3>
                    <div class="value">{chars.protagonist.brief_description}</div>
            """)
            if chars.protagonist.goal:
                html_parts.append(f"""
                    <div class="label">Goal:</div>
                    <div class="value">{chars.protagonist.goal}</div>
                """)
            if chars.protagonist.flaw:
                html_parts.append(f"""
                    <div class="label">Flaw:</div>
                    <div class="value">{chars.protagonist.flaw}</div>
                """)
        
        if chars.antagonist:
            html_parts.append(f"""
                    <h3>Antagonist: {chars.antagonist.name}</h3>
                    <div class="value">{chars.antagonist.brief_description}</div>
            """)
        
        if chars.supporting_cast:
            html_parts.append("""
                    <h3>Supporting Cast</h3>
            """)
            for char in chars.supporting_cast:
                html_parts.append(f"""
                    <div class="list-item"><strong>{char.name}</strong> ({char.role}): {char.brief_description}</div>
                """)
        
        html_parts.append("</div>")
    
    # Step 4: Plot Intent
    if session.plot_intent:
        pi = session.plot_intent
        html_parts.append("""
                <div class="section">
                    <h2>📖 Plot & Structure</h2>
        """)
        
        if pi.primary_conflict:
            html_parts.append(f"""
                    <h3>Primary Conflict</h3>
                    <div class="value">{pi.primary_conflict}</div>
            """)
        
        if pi.conflict_types:
            html_parts.append("""
                    <h3>Conflict Types</h3>
            """)
            for ct in pi.conflict_types:
                html_parts.append(f'<span class="badge">{ct}</span>')
        
        if pi.stakes:
            html_parts.append(f"""
                    <h3>Stakes</h3>
                    <div class="value">{pi.stakes}</div>
            """)
        
        if pi.inciting_incident or pi.first_plot_point or pi.midpoint_shift or pi.second_plot_point or pi.climax_confrontation or pi.resolution:
            html_parts.append("""
                    <h3>Story Structure</h3>
            """)
            if pi.inciting_incident:
                html_parts.append(f'<div class="list-item"><strong>Inciting Incident:</strong> {pi.inciting_incident}</div>')
            if pi.first_plot_point:
                html_parts.append(f'<div class="list-item"><strong>First Plot Point:</strong> {pi.first_plot_point}</div>')
            if pi.midpoint_shift:
                html_parts.append(f'<div class="list-item"><strong>Midpoint:</strong> {pi.midpoint_shift}</div>')
            if pi.second_plot_point:
                html_parts.append(f'<div class="list-item"><strong>Second Plot Point:</strong> {pi.second_plot_point}</div>')
            if pi.climax_confrontation:
                html_parts.append(f'<div class="list-item"><strong>Climax:</strong> {pi.climax_confrontation}</div>')
            if pi.resolution:
                html_parts.append(f'<div class="list-item"><strong>Resolution:</strong> {pi.resolution}</div>')
        
        if pi.romantic_subplot or pi.secondary_subplot or pi.thematic_subplot:
            html_parts.append("""
                    <h3>Subplots</h3>
            """)
            if pi.romantic_subplot:
                html_parts.append(f'<div class="list-item"><strong>Romance:</strong> {pi.romantic_subplot}</div>')
            if pi.secondary_subplot:
                html_parts.append(f'<div class="list-item"><strong>Secondary:</strong> {pi.secondary_subplot}</div>')
            if pi.thematic_subplot:
                html_parts.append(f'<div class="list-item"><strong>Thematic:</strong> {pi.thematic_subplot}</div>')
        
        html_parts.append("</div>")
    
    # Step 5: Structure Targets
    if session.structure_targets:
        st = session.structure_targets
        html_parts.append("""
                <div class="section">
                    <h2>🏗️ Structure & Format</h2>
        """)
        
        html_parts.append(f"""
                    <div class="label">Target Length:</div>
                    <div class="value">{st.target_word_count:,} words in {st.target_chapter_count} chapters</div>
        """)
        
        if st.pov_style:
            html_parts.append(f"""
                    <div class="label">Point of View:</div>
                    <div class="value"><span class="badge">{st.pov_style.value.replace('_', ' ').title()}</span></div>
            """)
        
        if st.tense_style:
            html_parts.append(f"""
                    <div class="label">Tense:</div>
                    <div class="value"><span class="badge">{st.tense_style.value.title()}</span></div>
            """)
        
        if st.pacing_preference:
            html_parts.append(f"""
                    <div class="label">Pacing:</div>
                    <div class="value"><span class="badge">{st.pacing_preference.value.title()}</span></div>
            """)
        
        html_parts.append("</div>")
    
    # Step 6: Constraints
    if session.constraints_profile:
        cn = session.constraints_profile
        html_parts.append("""
                <div class="section">
                    <h2>⚙️ Content Guidelines</h2>
        """)
        
        if cn.tropes_to_include:
            html_parts.append("""
                    <h3>Tropes to Include</h3>
            """)
            for trope in cn.tropes_to_include:
                html_parts.append(f'<span class="badge">{trope}</span>')
        
        if cn.tropes_to_avoid:
            html_parts.append("""
                    <h3>Tropes to Avoid</h3>
            """)
            for trope in cn.tropes_to_avoid:
                html_parts.append(f'<span class="badge">{trope}</span>')
        
        if cn.content_warnings:
            html_parts.append("""
                    <h3>Content Warnings</h3>
            """)
            for cw in cn.content_warnings:
                html_parts.append(f'<span class="badge">{cw}</span>')
        
        if cn.content_restrictions:
            html_parts.append("""
                    <h3>Content Restrictions</h3>
            """)
            for cr in cn.content_restrictions:
                html_parts.append(f'<span class="badge">{cr}</span>')
        
        if cn.faith_elements:
            html_parts.append(f"""
                    <h3>Faith Elements</h3>
                    <div class="value">{cn.faith_elements}</div>
            """)
        
        if cn.must_have_scenes:
            html_parts.append("""
                    <h3>Must-Have Scenes</h3>
            """)
            for scene in cn.must_have_scenes:
                html_parts.append(f'<div class="list-item">{scene}</div>')
        
        if cn.cultural_considerations:
            html_parts.append(f"""
                    <h3>Cultural Considerations</h3>
                    <div class="value">{cn.cultural_considerations}</div>
            """)
        
        html_parts.append("</div>")
    
    # Step 7: Baseline Premise
    if session.baseline_premise:
        bp = session.baseline_premise
        html_parts.append("""
                <div class="section">
                    <h2>✨ Baseline Premise</h2>
                    <div class="subtitle" style="text-align: left; margin-bottom: 1.5rem;">AI-generated synthesis using GPT-4o</div>
        """)
        
        if bp.content:
            html_parts.append(f"""
                    <div class="logline-box" style="font-size: 1rem; line-height: 1.9;">
                        {bp.content.replace(chr(10), '<br><br>')}
                    </div>
            """)
        
        if bp.word_count:
            html_parts.append(f"""
                    <div class="value" style="margin-top: 1rem; color: #95a5a6; font-size: 0.9rem;">
                        Word count: {bp.word_count} words
                    </div>
            """)
        
        html_parts.append("</div>")
    
    # Timestamp
    html_parts.append(f"""
                <div class="timestamp">
                    Last updated: {session.updated_at.strftime('%B %d, %Y at %I:%M %p')}
                </div>
    """)
    
    # Close HTML
    html_parts.append("""
            </div>
        </body>
        </html>
    """)
    
    return "".join(html_parts)
