<?php

declare(strict_types=1);

require_once __DIR__ . '/form_utils.php';

use PHPMailer\PHPMailer\Exception as MailException;

$responseOptions = [
  'returnPath' => '/devis',
  'returnLabel' => "Retourner au formulaire de devis",
  'successDefaultMessage' => 'Votre demande a bien ete envoyee.',
];

$wantsJson = form_wants_json();

if (function_exists('mb_internal_encoding')) {
  mb_internal_encoding('UTF-8');
}

form_handle_cors();

try {
  form_guard_request($wantsJson, $responseOptions);
} catch (RuntimeException $runtimeException) {
  if ($runtimeException->getMessage() === 'options') {
    exit;
  }
  throw $runtimeException;
}

try {
  form_validate_honeypot($_POST, 'estimation_check');
} catch (RuntimeException $runtimeException) {
  if ($runtimeException->getMessage() === 'honeypot') {
    exit;
  }
  throw $runtimeException;
}

$city = isset($_POST['city']) ? trim(strip_tags((string) $_POST['city'])) : '';
$project = isset($_POST['project']) ? trim(strip_tags((string) $_POST['project'])) : '';
$description = isset($_POST['description']) ? trim((string) $_POST['description']) : '';
$name = isset($_POST['name']) ? trim(strip_tags((string) $_POST['name'])) : '';
$email = isset($_POST['email']) ? filter_var((string) $_POST['email'], FILTER_VALIDATE_EMAIL) : false;
$phone = isset($_POST['phone']) ? trim(strip_tags((string) $_POST['phone'])) : '';

if ($city === '' || $project === '' || $description === '' || $name === '' || $email === false) {
  form_respond(
    $wantsJson,
    422,
    ['success' => false, 'message' => 'Tous les champs obligatoires doivent etre renseignes.'],
    $responseOptions
  );
}

$descriptionLength = function_exists('mb_strlen') ? mb_strlen($description) : strlen($description);
if ($descriptionLength > 4000) {
  form_respond(
    $wantsJson,
    413,
    ['success' => false, 'message' => 'La description de votre projet est trop longue.'],
    $responseOptions
  );
}

$normalizedPhone = $phone !== '' ? $phone : 'Non renseigne';

$bodyLines = [
  '<p><strong>Informations de contact</strong><br>' .
    '<b>Nom : </b>' . htmlspecialchars($name, ENT_QUOTES | ENT_HTML5) . '<br>' .
    '<b>Email : </b>' . htmlspecialchars((string) $email, ENT_QUOTES | ENT_HTML5) . '<br>' .
    '<b>Mobile : </b>' . htmlspecialchars($normalizedPhone, ENT_QUOTES | ENT_HTML5) . '</p>',
  '<p><strong>Details du projet</strong><br>' .
    '<b>Ville : </b>' . htmlspecialchars($city, ENT_QUOTES | ENT_HTML5) . '<br>' .
    '<b>Type de projet : </b>' . htmlspecialchars($project, ENT_QUOTES | ENT_HTML5) . '</p>',
  '<p><strong>Description :</strong><br>' .
    nl2br(htmlspecialchars($description, ENT_QUOTES | ENT_HTML5)) . '</p>',
];

$body = implode(PHP_EOL, $bodyLines);

$mailer = form_create_mailer();

try {
  form_dispatch_mail(
    $mailer,
    '[auxjardinsdadrien.com] Demande de devis',
    $body,
    (string) $email,
    $name
  );

  form_respond(
    $wantsJson,
    200,
    ['success' => true, 'message' => 'Merci, nous revenons vers vous avec un devis personnalise.'],
    $responseOptions
  );
} catch (MailException $exception) {
  error_log('[devis.php] PHPMailer exception: ' . $exception->getMessage());
}

form_respond(
  $wantsJson,
  500,
  ['success' => false, 'message' => "L'envoi de votre demande a echoue. Veuillez reessayer plus tard."],
  $responseOptions
);
