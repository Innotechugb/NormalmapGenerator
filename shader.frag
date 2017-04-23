#version 440 core
layout (depth_any) out float gl_FragDepth;

in GEOM_OUT
{
    vec2 tc;
    float depth;
    mat3 tbn;
    vec3 normal;
    vec4 position;
} fsIn;

out highp vec4 fColor;
uniform mat4 modelToWorld;
uniform mat4 worldToCamera;
uniform mat4 cameraToView;

uniform sampler2D diffuseMap;
uniform sampler2D normalMap;
uniform sampler2D specularMap;

uniform bool applyingDiffuse;
uniform bool applyingSpecular;
uniform bool applyingNormal;

uniform vec3 cameraPos;

struct Light
{
    vec3 Color;
    float AmbientIntensity;
    float DiffuseIntensity;
    vec3 Direction;
    float SpecPower;
    float MatShines;
};

uniform Light light;

vec4 lightFactorNormal()
{
    vec3 bumpMapNormal;
    if(applyingNormal)
        bumpMapNormal = texture(normalMap, fsIn.tc).xyz;
    else bumpMapNormal = vec3(0.0, 0.0, 1.0);
    bumpMapNormal = 2.0 * bumpMapNormal - vec3(1.0);
    bumpMapNormal = fsIn.tbn * bumpMapNormal;
    float factor = dot(bumpMapNormal, light.Direction);
    if(factor > 0.0)
    {
        return vec4(light.Color, 1.0) *
        light.DiffuseIntensity *
        factor;
    }
    else
        return vec4(0.0, 0.0, 0.0, 0.0);
}

vec4 lightFactorSpecular()
{
    if(applyingSpecular)
    {
        vec3 dir = normalize(light.Direction);
        vec3 lightPosition = 100.0 * (-light.Direction);
        vec3 incidenceVector = normalize(fsIn.position.xyz - lightPosition);
        vec3 reflectionVector = reflect(incidenceVector, fsIn.normal);
        vec3 surfaceToCamera = normalize(cameraPos - fsIn.position.xyz);
        float cosAngle = max(0.0, dot(surfaceToCamera, reflectionVector));
        float specularCoefficient = pow(cosAngle, light.MatShines);
        vec4 specularComponent = specularCoefficient *
                                 texture(specularMap, fsIn.tc) *
                                 light.SpecPower;
        return specularComponent;
    }
    else
        return vec4(0.0, 0.0, 0.0, 0.0);
}


void main()
{
    gl_FragDepth = fsIn.depth;
    vec4 diffuseLight = lightFactorNormal();
    vec4 specularLight = lightFactorSpecular();
    vec4 textureColor;
    if(applyingDiffuse)
        textureColor = texture(diffuseMap, fsIn.tc);
    else
        textureColor = vec4(0.7, 0.7, 0.7, 1.0);
    fColor = textureColor *
            (diffuseLight +
             specularLight +
             light.AmbientIntensity);
}