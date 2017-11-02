<?php

include_once '../../connect/class.connect_firebird.php';
extract($_POST);

$con = ConexaoFirebird::getConectar(12);

$sql = "select first :maxItem skip :skip num_fabricante, desc_produto, QUANTIDADE, VENDA "
        . "from produto where num_fabricante like :NUM_FABRICANTE AND desc_produto like :DESC";

$pdo = $con->prepare($sql);
$pdo->execute($param);

$rs = $pdo->fetchAll(PDO::FETCH_OBJ);
echo json_encode($rs);

